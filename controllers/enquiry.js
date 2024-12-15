const Enquiry = require("../models/Enquiry")


exports.getEnquiry = async (req, res) => {
    const id = req.params?.id
    try {
        if (id) {
            const enquiry = await Enquiry.findById(id)
            if (!enquiry) {
                return res.status(404).json({ message: "Enquiry not found", success: false });
            }
            return res.status(200).json({ message: "Enquiry fetched successfully", result: enquiry, success: true });
        }
        const enquiries = await Enquiry.find({}).sort({ createdAt: -1 });
        if (enquiries) {
            return res.status(200).json({ message: "Enquiries fetched successfully", result: enquiries, success: true });
        }
        return res.status(404).json({ message: "Enquiries not found!", success: false });
    } catch (error) {
        console.log("error on getEnquiry", error);
        return res.status(500).json({ message: error.message, error, success: false });
    }
}


exports.addEnquiry = async (req, res) => {
    const fname = req.body?.fname
    const lname = req.body?.lname
    const gender = req.body?.gender
    const dob = req.body?.dob
    const dot = req.body?.dot
    const birthPlace = req.body?.birthPlace
    const maritalStatus = req.body?.maritalStatus
    const reason = req.body?.reason
    const mobile = req.body?.mobile
    const type = req.body?.type
    const partnerDetails = req.body?.partnerDetails


    try {
        const result = await Enquiry.create({ fname, lname, gender, dob, dot, birthPlace, maritalStatus, reason, mobile, type, partnerDetails })
        if (result) {
            return res.status(200).json({ message: "Enquiry added successfully", result, success: true });
        }
        return res.status(400).json({ message: "Failed to add enquiry", success: false });
    } catch (error) {
        console.log("error on addEnquiry", error);
        return res.status(500).json({ message: error.message, error, success: false });
    }
}

exports.updateEnquiry = async (req, res) => {
    const id = req.params?.id
    const status = req.body?.status
    try {
        if (!id) {
            return res.status(400).json({ message: "Id is required", success: false });
        }

        const checkEnquiry = await Enquiry.findById(id)
        if (!checkEnquiry) {
            return res.status(404).json({ message: "Enquiry not found", success: false });
        }
        checkEnquiry.status = status

        await checkEnquiry.save();
        return res.status(200).json({ message: "Enquiry updated successfully", result: checkEnquiry, success: true });
    } catch (error) {
        console.log("error on updateEnquiry", error);
        return res.status(500).json({ message: error.message, error, success: false });
    }
}

exports.deleteEnquiry = async (req, res) => {
    const id = req.params?.id
    try {
        if (!id) {
            return res.status(400).json({ message: "Id is required", success: false });
        }
        const checkEnquiry = await Enquiry.findById(id);
        if (!checkEnquiry) {
            return res.status(404).json({ message: "Enquiry not found", success: false });
        }
        const result = await Enquiry.findByIdAndDelete(id);
        if (result) {
            return res.status(200).json({ message: "Enquiry deleted successfully", result, success: true });
        }
        return res.status(400).json({ message: "Failed to delete enquiry", success: false });
    } catch (error) {
        console.log("error on deleteEnquiry", error);
        return res.status(500).json({ message: error.message, error, success: false });
    }
}