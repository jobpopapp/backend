const supabase = require('../config/supabase');

const getBillingAddress = async (req, res) => {
    const { data, error } = await supabase
        .from('billing_addresses')
        .select('*')
        .eq('company_id', req.user.id)
        .single();

    if (error && error.code !== 'PGRST116') { // Ignore 'not found' error
        return res.status(500).json({ error: error.message });
    }

    res.json(data);
};

const upsertBillingAddress = async (req, res) => {
    const { ...addressData } = req.body;

    const { data, error } = await supabase
        .from('billing_addresses')
        .upsert({ ...addressData, company_id: req.user.id }, { onConflict: 'company_id' });

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data);
};

module.exports = {
    getBillingAddress,
    upsertBillingAddress,
};