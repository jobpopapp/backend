const { supabase } = require('../config/supabase');
const axios = require('axios');

const PESAPAL_API = "https://pay.pesapal.com/v3/api";

const getAuthToken = async () => {
  try {
    const res = await axios.post(`${PESAPAL_API}/Auth/RequestToken`, {
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    });
    return res.data.token;
  } catch (error) {
    console.error(
      "Pesapal Auth Error:",
      error.response ? error.response.data : error.message
    );
    throw new Error("Could not authenticate with Pesapal");
  }
};

const getTransactionStatus = async (orderTrackingId) => {
    const token = await getAuthToken();
    const response = await axios.get(
        `${PESAPAL_API}/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        }
    );
    return response.data;
};

exports.handleIpn = async (req, res) => {
    const { OrderTrackingId } = req.body;

    try {
        const transaction = await getTransactionStatus(OrderTrackingId);
        const { payment_status_description } = transaction;

        await supabase
            .from('subscriptions')
            .update({ status: payment_status_description })
            .eq('pesapal_tracking_id', OrderTrackingId);

        res.status(200).send('IPN received');
    } catch (error) {
        console.error('Error handling IPN:', error);
        res.status(500).send('Error handling IPN');
    }
};

exports.handleCallback = async (req, res) => {
    const { OrderTrackingId } = req.query;

    try {
        const transaction = await getTransactionStatus(OrderTrackingId);
        const { payment_status_description } = transaction;

        await supabase
            .from('subscriptions')
            .update({ status: payment_status_description })
            .eq('pesapal_tracking_id', OrderTrackingId);

        // Redirect to a success or failure page on the frontend
        if (payment_status_description === 'Completed') {
            res.redirect(`${process.env.FRONTEND_URL}/payment-success`);
        } else {
            res.redirect(`${process.env.FRONTEND_URL}/payment-failure`);
        }
    } catch (error) {
        console.error('Error handling callback:', error);
        res.redirect(`${process.env.FRONTEND_URL}/payment-error`);
    }
};

// Get all subscription plans
exports.getSubscriptionPlans = async (req, res) => {
    const { data, error } = await supabase.from('subscription_plans').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
};

// Get a single subscription plan
exports.getSubscriptionPlan = async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('subscription_plans').select('*').eq('id', id).single();
    if (error) return res.status(404).json({ error: 'Plan not found' });
    res.json(data);
};

// Create a new subscription plan
exports.createSubscriptionPlan = async (req, res) => {
    const { data, error } = await supabase.from('subscription_plans').insert([req.body]);
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
};

// Update a subscription plan
exports.updateSubscriptionPlan = async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('subscription_plans').update(req.body).eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
};

// Delete a subscription plan
exports.deleteSubscriptionPlan = async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('subscription_plans').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.status(204).send();
};

// Get subscription status for a company
exports.getSubscriptionStatus = async (req, res) => {
    const companyId = req.companyId;
    const { data, error } = await supabase
        .from('subscriptions')
        .select('status, plan_type, pesapal_tracking_id')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        return res.status(404).json({ error: 'No subscription found' });
    }

    res.json(data);
};