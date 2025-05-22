import express from 'express';
import Task from '../models/Task.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Create Task
router.post('/', requireAuth, async (req, res) => {
    try {
        const user = req.user;
        const { task, description, date } = req.body;

        if (!task) {
            return res.status(400).json({ code: 400, message: 'task is empty.' })
        }
        const taskData = await Task.create({ task, description, date, user: user._id });

        res.status(201).json({ code: 201, message: 'Task Add successfully', data: { taskData } });
    } catch (err) {
        console.log(err, 'erorr.........');
        res.status(500).json({ code: 500, message: 'Internal Server Error: Task creation failed', error: err.message });
    }
});

// Get All Tasks (With Optional Filters)
router.get('/', requireAuth, async (req, res) => {
    console.log('get api calling.........');

    const { status, search } = req.query;
    const user = req.user;
    let query = { user: user._id };
    console.log(status, 'status....');
    const normalizedStatus = status ? status.trim().toLowerCase() : null;

    if (normalizedStatus === 'pending') {
        query.status = 'pending'
    } else if (normalizedStatus === 'completed') {
        query.status = 'completed'
    } else if (normalizedStatus === 'all') {
        query.status = { $in: ['pending', 'completed'] };
    }
    if (search) query.title = { $regex: search, $options: 'i' };

    try {
        const taskData = await Task.find(query);
        console.log(taskData, 'taskData.....');

        if (!taskData) {
            return res.status(400).json({ code: 400, message: "task not found" });
        }
        res.status(200).json({ code: 200, message: 'Task details retrieve', data: { taskData } });
    } catch (err) {
        res.status(500).json({ code: 500, message: 'Internal Server Error: Failed to fetch tasks', error: err.message });
    }
});

// Update Task
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const user = req.user;
        const { task, description, date } = req.body;

        const taskData = await Task.findOneAndUpdate(
            { _id: req.params.id, user: user._id },
            { task, description, date },
            { new: true }
        );

        if (!taskData) return res.status(404).json({ code: 404, message: 'Task not found' });
        res.status(200).json({ code: 200, message: 'Task Update successfully', data: { taskData } });
    } catch (err) {
        console.log(err, 'err');
        res.status(500).json({ code: 500, message: 'Internal Server Error: Update failed', error: err.message });
    }
});

// Delete Task
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const user = req.user;
        const result = await Task.deleteOne({ _id: req.params.id, user: user._id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ code: 404, message: 'Task not found' });
        }
        res.status(200).json({ code: 200, message: 'Task deleted successfully' });
    } catch (err) {
        res.status(500).json({ code: 500, message: 'Internal Server Error: Delete failed', error: err.message });
    }
});

router.patch('/:id/status', requireAuth, async (req, res) => {
    try {
        const user = req.user;
        const { status } = req.body;

        if (!['pending', 'completed'].includes(status)) {
            return res.status(400).json({ code: 400, message: "Invalid status value" })
        }
        const taskData = await Task.findOneAndUpdate(
            { _id: req.params.id, user: user._id },
            { status },
            { new: true }
        );
        if (!taskData) {
            return res.status(400).json({ code: 400, message: "task not found" });
        }

        res.status(200).json({ code: 200, message: "status update sucessfully", data: { taskData } });

    } catch (error) {
        console.log(error, 'error.....');
        res.status(500).json({ code: 500, message: 'Internal Server Error: Delete failed', error: err.message });
    }
});
export default router;
