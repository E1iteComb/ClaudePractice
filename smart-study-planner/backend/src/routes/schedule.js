const { Router } = require('express');
const auth = require('../middleware/auth');
const { generateScheduleHandler, getSchedule, updateSessionStatus } = require('../controllers/scheduleController');

const router = Router();

router.use(auth);

router.post('/generate-schedule', generateScheduleHandler);
router.get('/schedule', getSchedule);
router.patch('/sessions/:id/complete', updateSessionStatus);

module.exports = router;
