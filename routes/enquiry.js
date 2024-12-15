const express = require('express');
const { addEnquiry, getEnquiry, deleteEnquiry, updateEnquiry } = require('../controllers/enquiry');
const { addEnquiryValidation } = require('../middleware/enquiryValidation');
const { updatedStatusAstro } = require('../controllers/astrologerController');
const { protect } = require('../middleware/authMiddleware');
const enquiryRouter = express.Router();


enquiryRouter.get('/', getEnquiry)

enquiryRouter.get('/:id', getEnquiry)

enquiryRouter.post('/add', addEnquiryValidation, addEnquiry)

enquiryRouter.put('/update/:id', updateEnquiry)

enquiryRouter.delete('/delete/:id', deleteEnquiry)


// this need to move to astro router
enquiryRouter.put('/update-online', protect, updatedStatusAstro)


module.exports = enquiryRouter