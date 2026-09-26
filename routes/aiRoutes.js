const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { symptomCheck, healthChat } = require('../controllers/aiController');

router.post('/symptom-check', protect, symptomCheck);
router.post('/chat', protect, healthChat);

module.exports = router;
