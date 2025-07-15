const axios = require('axios');
const supabase = require('../config/supabase');

const PESAPAL_API = process.env.PESAPAL_ENVIRONMENT === 'live' 
    ? 'https://pay.pesapal.com/v3' 
    : 'https://cybqa.pesapal.com/pesapal-iframe/api/v3';

// Get Pesapal Auth Token
const getAuthToken = async () => {
    try {
        const res = await axios.post(`${PESAPAL_API}/api/Auth/RequestToken`, {
            consumer_key: process.env.PESAPAL_CONSUMER_KEY,
            consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
        });
        return res.data.token;
    } catch (error) {
        console.error('Pesapal Auth Error:', error.response ? error.response.data : error.message);
        throw new Error('Could not authenticate with Pesapal');
    }
};

// Submit Order to Pesapal
exports.submitOrder = async (req, res) => {
    const { planType } = req.body;
    const companyId = req.user.id;

    // 1. Get Billing Address
    const { data: billingAddress, error: addressError } = await supabase
        .from('billing_addresses')
        .select('*')
        .eq('company_id', companyId)
        .single();

    if (addressError || !billingAddress) {
        return res.status(400).json({ error: 'Billing address not found. Please create one first.' });
    }

    // 2. Get Plan Details (You should have a table for plans)
    // For now, we'll use hardcoded values based on README
    const plans = {
        monthly: { amount: 50000, description: 'Monthly Subscription' },
        annual: { amount: 500000, description: 'Annual Subscription' },
        per_job: { amount: 10000, description: 'Per Job Post' },
    };

    const plan = plans[planType];
    if (!plan) {
        return res.status(400).json({ error: 'Invalid subscription plan.' });
    }

    // 3. Get Pesapal Token
    let token;
    try {
        token = await getAuthToken();
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }

    // 4. Construct Order Payload
    const orderPayload = {
        id: `JOBPOP-${companyId}-${Date.now()}`,
        currency: 'UGX', // or KES, etc.
        amount: plan.amount,
        description: plan.description,
        callback_url: `${process.env.API_BASE_URL}/api/subscription/callback`,
        notification_id: process.env.PESAPAL_IPN_ID, // Get this from your Pesapal dashboard
        billing_address: {
            email_address: billingAddress.email_address,
            phone_number: billingAddress.phone_number,
            country_code: billingAddress.country_code,
            first_name: billingAddress.first_name,
            last_name: billingAddress.last_name,
        }
    };

    // 5. Submit Order
    try {
        const response = await axios.post(`${PESAPAL_API}/api/SubmitOrderRequest`, orderPayload, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // 6. Save transaction details for reconciliation
        await supabase.from('subscriptions').insert([
            {
                company_id: companyId,
                plan_type: planType,
                pesapal_tracking_id: response.data.tracking_id,
                status: 'PENDING'
            }
        ]);

        res.json({ redirect_url: response.data.redirect_url });

    } catch (error) {
        console.error('Pesapal Order Submission Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to submit order to Pesapal.' });
    }
};