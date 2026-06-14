const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { auth } = require('../middleware/auth');

// FIXED ALIGNMENT: Aligned all handler properties directly with our controller exports to stop the crash!
router.post('/', auth, maintenanceController.createTicket);
router.get('/', auth, maintenanceController.getTickets);
router.put('/:id', auth, maintenanceController.updateTicketStatus);

module.exports = router;