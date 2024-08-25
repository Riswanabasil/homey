const Offer=require("../../models/OfferSchema")


const viewOffer=async(req,res)=>{
    try {
        const offer = await Offer.findOne(); // Assume there's only one offer document
        if (!offer) {
            // Handle the case where no offer settings are found by initializing defaults
            return res.render('referral', {
                offer: {
                    isActive: false,
                    creditAmount: 0 // Set a sensible default or the last known good configuration
                }
            });
        }
        res.render('referral', { offer });
    } catch (error) {
        console.error('Failed to fetch referral offer settings:', error);
        res.status(500).send('Server error');
    }
}
const referralOffer=async(req,res)=>{
    const { creditAmount, isActive } = req.body;

    // Validate isActive input
    if (isActive !== 'true' && isActive !== 'false') {
        return res.status(400).json({ message: 'Invalid input for isActive. Must be "true" or "false".' });
    }

    try {
        const offer = await Offer.findOne();
        if (!offer) {
            const newOffer = new Offer({
                creditAmount: creditAmount,
                isActive: isActive === 'true'
            });
            await newOffer.save();
            return res.status(201).json({ message: 'New referral offer settings created successfully.', offer: newOffer });
        } else {
            offer.creditAmount = creditAmount;
            offer.isActive = isActive === 'true';
            await offer.save();
            return res.status(200).json({ message: 'Referral offer settings updated successfully.', offer });
        }
    } catch (error) {
        console.error('Failed to update referral offer settings:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
}
module.exports={viewOffer,referralOffer}