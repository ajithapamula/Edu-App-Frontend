// ============================================================
// FILE: src/components/mentor/TaskResults/TaskResultsPage.jsx
// PURPOSE: Mentor views student task evaluation results
// ============================================================

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Card, CardContent, Grid, FormControl, InputLabel,
    Select, MenuItem, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Chip, CircularProgress, Alert, Button,
} from '@mui/material';
import { CheckCircle, Cancel, FilterList, Refresh, Assessment } from '@mui/icons-material';
import { useAuth } from '../../../hooks/useAuth';
import { getStudentTaskResultFilters, getStudentTaskResults } from '../../../services/API/studentTaskResults';

const TaskResultsPage = () => {
    const { user } = useAuth();
    const mentorId = user?.mentor_id || user?.id;

    const [batches, setBatches] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState('');
    const [selectedSession, setSelectedSession] = useState('');
    const [selectedTask, setSelectedTask] = useState('');
    const [results, setResults] = useState([]);
    const [totalResults, setTotalResults] = useState(0);
    const [loadingBatches, setLoadingBatches] = useState(false);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [loadingResults, setLoadingResults] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (mentorId) fetchBatches();
    }, [mentorId]);

    const fetchBatches = async () => {
        setLoadingBatches(true);
        setError('');
        try {
            const response = await getStudentTaskResultFilters('mentor', mentorId);
            setBatches(response.batches || []);
        } catch (err) { setError('Failed to load batches'); console.error(err); }
        finally { setLoadingBatches(false); }
    };

    const handleBatchChange = async (e) => {
        const batchId = e.target.value;
        setSelectedBatch(batchId);
        setSelectedSession(''); setSelectedTask('');
        setSessions([]); setTasks([]); setResults([]); setTotalResults(0);
        if (!batchId) return;

        setLoadingSessions(true); setError('');
        try {
            const response = await getStudentTaskResultFilters('mentor', mentorId, { batch_id: batchId });
            setSessions(response.sessions || []);
        } catch (err) { setError('Failed to load sessions'); console.error(err); }
        finally { setLoadingSessions(false); }
    };

    const handleSessionChange = async (e) => {
        const sessionId = e.target.value;
        setSelectedSession(sessionId);
        setSelectedTask(''); setTasks([]); setResults([]); setTotalResults(0);
        if (!sessionId) return;

        setLoadingTasks(true); setError('');
        try {
            const response = await getStudentTaskResultFilters('mentor', mentorId, { batch_id: selectedBatch, session_id: sessionId });
            setTasks(response.tasks || []);
        } catch (err) { setError('Failed to load tasks'); console.error(err); }
        finally { setLoadingTasks(false); }

        fetchResults(selectedBatch, sessionId, '');
    };

    const handleTaskChange = (e) => {
        const taskId = e.target.value;
        setSelectedTask(taskId);
        fetchResults(selectedBatch, selectedSession, taskId);
    };

    const fetchResults = async (batchId, sessionId, taskId) => {
        if (!batchId || !sessionId) return;
        setLoadingResults(true); setError('');
        try {
            const params = { batch_id: batchId, session_id: sessionId };
            if (taskId) params.task_id = taskId;
            const response = await getStudentTaskResults('mentor', mentorId, params);
            setResults(response.results || []);
            setTotalResults(response.total_results || 0);
        } catch (err) { setError('Failed to load evaluation results'); console.error(err); }
        finally { setLoadingResults(false); }
    };

    const handleRefresh = () => {
        if (selectedBatch && selectedSession) fetchResults(selectedBatch, selectedSession, selectedTask);
    };

    const getRatingColor = (rating) => {
        switch (rating?.toLowerCase()) {
            case 'excellent': return '#0d9488';
            case 'good': return '#2563eb';
            case 'average': return '#f59e0b';
            case 'poor': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'evaluated': return 'success';
            case 'pending': return 'warning';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Assessment sx={{ fontSize: 32, color: '#7c3aed' }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>Student Task Results</Typography>
                </Box>
                {selectedBatch && selectedSession && (
                    <Button variant="outlined" startIcon={<Refresh />} onClick={handleRefresh} size="small">Refresh</Button>
                )}
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

            <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <FilterList sx={{ color: '#6b7280' }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#374151' }}>Filters</Typography>
                    </Box>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={4}>
                            <FormControl fullWidth size="small" sx={{ minWidth: 180 }}>
                                <InputLabel>Select Batch</InputLabel>
                                <Select value={selectedBatch} onChange={handleBatchChange} label="Select Batch" disabled={loadingBatches}>
                                    <MenuItem value=""><em>-- Select Batch --</em></MenuItem>
                                    {batches.map((b) => <MenuItem key={b.batch_id} value={b.batch_id}>{b.batch_code}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <FormControl fullWidth size="small" sx={{ minWidth: 180 }}>
                                <InputLabel>Select Session</InputLabel>
                                <Select value={selectedSession} onChange={handleSessionChange} label="Select Session" disabled={!selectedBatch || loadingSessions}>
                                    <MenuItem value=""><em>-- Select Session --</em></MenuItem>
                                    {sessions.map((s) => <MenuItem key={s.session_id} value={s.session_id}>Session {s.session_id}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <FormControl fullWidth size="small" sx={{ minWidth: 180 }}>
                                <InputLabel>Select Task</InputLabel>
                                <Select value={selectedTask} onChange={handleTaskChange} label="Select Task" disabled={!selectedSession || loadingTasks}>
                                    <MenuItem value=""><em>-- All Tasks --</em></MenuItem>
                                    {tasks.map((t) => <MenuItem key={t.task_id} value={t.task_id}>{t.task_name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {loadingResults ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
            ) : results.length > 0 ? (
                <>
                    <Typography variant="body2" sx={{ mb: 1.5, color: '#6b7280' }}>
                        Showing {totalResults} result{totalResults !== 1 ? 's' : ''}
                    </Typography>
                    <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                                    <TableCell sx={{ fontWeight: 700, color: '#374151' }}>#</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Student Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Task Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Submitted Date</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Score</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Result</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Rating</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {results.map((row, index) => (
                                    <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#f8fafc' }, '&:last-child td': { borderBottom: 0 } }}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell sx={{ fontWeight: 500 }}>{row.student_name}</TableCell>
                                        <TableCell>{row.task_name}</TableCell>
                                        <TableCell sx={{ color: '#6b7280', fontSize: '0.85rem' }}>{row.submitted_date}</TableCell>
                                        <TableCell>
                                            <Chip label={row.evaluation_status} color={getStatusColor(row.evaluation_status)} size="small" sx={{ fontWeight: 600, textTransform: 'capitalize', fontSize: '0.75rem' }} />
                                        </TableCell>
                                        <TableCell>
                                            <Typography sx={{ fontWeight: 700, color: row.overall_score >= 70 ? '#0d9488' : row.overall_score >= 40 ? '#f59e0b' : '#ef4444' }}>
                                                {row.overall_score}%
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={row.passed ? <CheckCircle sx={{ fontSize: '16px !important' }} /> : <Cancel sx={{ fontSize: '16px !important' }} />}
                                                label={row.passed ? 'PASSED' : 'FAILED'} size="small"
                                                sx={{ fontWeight: 700, fontSize: '0.72rem', backgroundColor: row.passed ? 'rgba(13,148,136,0.12)' : 'rgba(239,68,68,0.12)', color: row.passed ? '#0d9488' : '#ef4444', '& .MuiChip-icon': { color: row.passed ? '#0d9488' : '#ef4444' } }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={row.rating} size="small" sx={{ fontWeight: 600, fontSize: '0.72rem', textTransform: 'capitalize', backgroundColor: `${getRatingColor(row.rating)}18`, color: getRatingColor(row.rating), borderRadius: '6px' }} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            ) : selectedBatch && selectedSession && !loadingResults ? (
                <Card sx={{ borderRadius: 2, textAlign: 'center', py: 6 }}>
                    <Assessment sx={{ fontSize: 48, color: '#d1d5db', mb: 1 }} />
                    <Typography variant="h6" sx={{ color: '#9ca3af', fontWeight: 500 }}>No evaluations found</Typography>
                    <Typography variant="body2" sx={{ color: '#9ca3af', mt: 0.5 }}>No student task evaluations found for this batch and session.</Typography>
                </Card>
            ) : (
                <Card sx={{ borderRadius: 2, textAlign: 'center', py: 6 }}>
                    <FilterList sx={{ fontSize: 48, color: '#d1d5db', mb: 1 }} />
                    <Typography variant="h6" sx={{ color: '#9ca3af', fontWeight: 500 }}>Select Filters</Typography>
                    <Typography variant="body2" sx={{ color: '#9ca3af', mt: 0.5 }}>Please select a Batch and Session to view student evaluation results.</Typography>
                </Card>
            )}
        </Box>
    );
};

export default TaskResultsPage;