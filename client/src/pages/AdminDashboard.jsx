import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { logout } from '../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import { translations } from '../utils/translations';
import toast from 'react-hot-toast';
import { API_URL } from '../utils/apiConfig';
import { Eye, EyeOff, Users, LayoutDashboard, FileText, LogOut, Plus, RefreshCw, GraduationCap, Award, ClipboardList, Send, Clock, Trash2, ChevronLeft, BarChart3, Database, UserPlus, ArrowRight, TrendingUp, Search, Star, Zap, Calendar, Mail, CheckCircle2, Settings, Key, ShieldCheck, History, Edit3, User, Camera, Save, X, PieChart, Trophy, Target, Activity, BookOpen, Check, MessageSquarePlus, MessageSquare, Menu } from 'lucide-react';

const AdminDashboard = () => {
    const { user, token } = useSelector((state) => state.auth);
    const { language } = useSelector((state) => state.ui);
    const t = translations[language];
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(localStorage.getItem('adminActiveTab') || 'overview');
    const [selectedDept, setSelectedDept] = useState(localStorage.getItem('adminSelectedDept') || null);
    const [searchQuery, setSearchQuery] = useState('');
    const [timeFilter, setTimeFilter] = useState('all');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile Sidebar State
    const [showToast, setShowToast] = useState(false); // Added for fetchData toast logic


    useEffect(() => {
        localStorage.setItem('adminActiveTab', activeTab);
    }, [activeTab]);

    useEffect(() => {
        if (selectedDept) localStorage.setItem('adminSelectedDept', selectedDept);
        else localStorage.removeItem('adminSelectedDept');
    }, [selectedDept]);

    // Profile State
    const [profileData, setProfileData] = useState({ name: '', email: '', password: '', image: '' });
    const [showProfilePassword, setShowProfilePassword] = useState(false);

    // Forms
    const [teacherData, setTeacherData] = useState({ name: '', email: '', password: '', subject: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [showAddSubject, setShowAddSubject] = useState(false);

    // Settings Related
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetData, setResetData] = useState({ id: '', name: '', newPassword: '' });
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [taskData, setTaskData] = useState({ teacherId: '', teacherName: '', text: '' });

    // Data
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [viewingResultStudent, setViewingResultStudent] = useState(null);
    const [testsCount, setTestsCount] = useState(0); // Added testsCount state

    // PORTED TEACHER STATE
    const [qData, setQData] = useState({ questionText: '', options: ['', '', '', ''], correctOption: 0 });
    const [myQuestions, setMyQuestions] = useState([]);
    const [topicName, setTopicName] = useState('');
    const [builderQuestions, setBuilderQuestions] = useState([]);
    const [activeTests, setActiveTests] = useState([]);
    const [groups, setGroups] = useState([]);
    const [groupSubjectFilter, setGroupSubjectFilter] = useState('');
    const [studentGroupFilter, setStudentGroupFilter] = useState('');
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [selectedTestId, setSelectedTestId] = useState('');
    const [viewingTest, setViewingTest] = useState(null);
    const [testQuestions, setTestQuestions] = useState([]);
    const [viewingGroup, setViewingGroup] = useState(null);
    const [groupStudents, setGroupStudents] = useState([]);
    const [newStudentName, setNewStudentName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState('');

    // Task & Chat State
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [chatMessage, setChatMessage] = useState('');

    const fetchData = async (force = false) => {
        if (!token) return;
        const config = { headers: { Authorization: `Bearer ${token} ` } };
        setIsRefreshing(true);
        try {
            await Promise.all([
                axios.get(`${API_URL}/students`, config).then(res => setStudents(res.data)),
                axios.get(`${API_URL}/auth/teachers`, config).then(res => setTeachers(res.data)),
                axios.get(`${API_URL}/subjects`, config).then(res => setSubjects(res.data.map(s => s.name))),
                axios.get(`${API_URL}/tests/count`, config).then(res => setTestsCount(res.data)),
                axios.get(`${API_URL}/groups`, config).then(res => setGroups(res.data)),
                axios.get(`${API_URL}/tasks`, config).then(res => setTasks(res.data))
            ]);
            if (force) toast.success('Ma\'lumotlar yangilandi!');
            setShowToast(true);
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            if (err.response?.status === 401 || err.response?.status === 403 || err.response?.status === 400) {
                toast.error('Sessiya vaqti tugadi. Qaytadan kiring.');
                dispatch(logout());
                navigate('/login');
            } else {
                if (showToast) toast.error('Xatolik: ' + msg);
            }
        } finally {
            setIsRefreshing(false);
        }
    };

    const fetchTasks = async () => {
        if (!token) return;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            const res = await axios.get(`${API_URL}/tasks`, config);
            setTasks(res.data);
            if (selectedTask) {
                const updated = res.data.find(t => t._id === selectedTask._id);
                if (updated) setSelectedTask(updated);
            }
        } catch (err) {
            console.error('Task error', err);
            if (err.response?.status === 500) {
                toast.error('Server xatosi: Vazifalar yuklanmadi.');
            } else if (err.response?.status === 401 || err.response?.status === 403 || err.response?.status === 400) {
                dispatch(logout());
                navigate('/login');
            }
        }
    };

    const fetchProfile = async () => {
        if (!token) return;
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`${API_URL}/auth/profile`, config);
            setProfileData({ ...res.data, password: '' });
        } catch (err) {
            console.error('Profile fetch error', err);
            // If user not found (404) or unauthorized (401), force logout
            if (err.response?.status === 404 || err.response?.status === 401) {
                dispatch(logout());
                window.location.href = '/login'; // Force hard redirect to clear state
            }
        }
    };

    useEffect(() => {
        if (!user || !token) {
            window.location.href = '/login';
            return;
        }
    }, [user, token]);

    useEffect(() => {
        if (token) {
            fetchData();
            fetchProfile();
            fetchTasks();
        }
        const interval = setInterval(() => { if (token) { fetchData(); fetchTasks(); } }, 30000);
        return () => clearInterval(interval);
    }, [token]);

    useEffect(() => {
        import('aos').then(AOS => AOS.refresh());
    }, [activeTab, students, teachers, subjects, groups, tasks]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const loadToast = toast.loading('Profil yangilanmoqda...');
        try {
            const updateObj = { ...profileData };
            if (!updateObj.password) delete updateObj.password;
            await axios.put(`${API_URL}/auth/profile`, updateObj, config);
            toast.success('Profil muvaffaqiyatli yangilandi!', { id: loadToast });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Xatolik', { id: loadToast });
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setProfileData({ ...profileData, image: reader.result });
            reader.readAsDataURL(file);
        }
    };

    // Deep Analytics Memo
    const stats = useMemo(() => {
        const now = new Date();
        const filterDate = (dateStr) => {
            const date = new Date(dateStr);
            if (timeFilter === 'week') return (now - date) <= 7 * 24 * 60 * 60 * 1000;
            if (timeFilter === 'month') return (now - date) <= 30 * 24 * 60 * 60 * 1000;
            if (timeFilter === 'year') return (now - date) <= 365 * 24 * 60 * 60 * 1000;
            return true;
        };

        const normalize = (str) => str?.toString().toLowerCase().trim() || '';
        const fStudents = Array.isArray(students) ? students.filter(s => filterDate(s.createdAt)) : [];
        const fTeachers = Array.isArray(teachers) ? teachers.filter(t => filterDate(t.createdAt || now)) : [];
        const fGroups = Array.isArray(groups) ? groups.filter(g => filterDate(g.createdAt)) : [];
        const fTasks = Array.isArray(tasks) ? tasks.filter(t => filterDate(t.createdAt)) : [];

        const passThreshold = 60;
        const passedCount = fStudents.filter(s => (s.score || 0) >= passThreshold).length;
        const qualityRate = fStudents.length > 0 ? ((passedCount / fStudents.length) * 100).toFixed(0) : 0;
        const avgGlobalScore = fStudents.length > 0 ? (fStudents.reduce((a, b) => a + (b.score || 0), 0) / fStudents.length).toFixed(1) : 0;

        const dStats = Array.isArray(subjects) ? subjects.map(sub => {
            const sn = normalize(sub);
            const sTeachers = fTeachers.filter(t => normalize(t.subject) === sn);
            const sStudents = fStudents.filter(s => normalize(s.chosenSubject) === sn);
            const sPass = sStudents.filter(s => (s.score || 0) >= passThreshold).length;
            const sQuality = sStudents.length > 0 ? ((sPass / sStudents.length) * 100).toFixed(0) : 0;
            const sAvg = sStudents.length > 0 ? (sStudents.reduce((a, b) => a + (b.score || 0), 0) / sStudents.length).toFixed(1) : 0;

            return {
                name: sub,
                teachers: sTeachers,
                studentCount: sStudents.length,
                quality: sQuality,
                avgScore: sAvg,
                topPerformers: sTeachers.sort((a, b) => (b.tasks?.length || 0) - (a.tasks?.length || 0)).slice(0, 2)
            };
        }) : [];

        const top5Students = [...fStudents].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5);

        // Recent Activities
        const studentActivities = fStudents.map(s => ({
            type: 'student',
            title: 'Yangi o\'quvchi',
            desc: `${s.fullName} tizimga qo'shildi`,
            time: s.createdAt,
            icon: GraduationCap,
            color: 'text-blue-500',
            bg: 'bg-blue-50'
        }));

        const groupActivities = fGroups.map(g => ({
            type: 'group',
            title: 'Yangi guruh',
            desc: `"${g.name}" ${g.subject} yo'nalishida ochildi`,
            time: g.createdAt,
            icon: Users,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50'
        }));

        const taskActivities = fTasks.map(t => ({
            type: 'task',
            title: 'Vazifa holati',
            desc: `"${t.title}" vazifasi ${t.status} holatiga keldi`,
            time: t.updatedAt,
            icon: ClipboardList,
            color: 'text-amber-500',
            bg: 'bg-amber-50'
        }));

        const recentActivities = [...studentActivities, ...groupActivities, ...taskActivities]
            .sort((a, b) => new Date(b.time) - new Date(a.time))
            .slice(0, 8);

        const mostActiveTeacher = fTeachers.length > 0
            ? [...fTeachers].sort((a, b) => (b.tasks?.length || 0) + (groups.filter(g => g.teacherId === a._id || g.teacherId?._id === a._id).length) - ((a.tasks?.length || 0) + (groups.filter(g => g.teacherId === b._id || g.teacherId?._id === b._id).length)))[0]
            : null;

        return {
            fStudents, fTeachers, passedCount, qualityRate, avgGlobalScore, dStats, top5Students, recentActivities, mostActiveTeacher
        };
    }, [students, teachers, subjects, timeFilter, groups, tasks]);

    const handleLogout = () => { dispatch(logout()); toast.success('Xayr, Boss!'); navigate('/login'); };
    const handleAddTeacher = async (e) => {
        e.preventDefault();
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const loadToast = toast.loading('Ustoz qo\'shilmoqda...');
        try {
            await axios.post(`${API_URL}/auth/register`, { ...teacherData, role: 'teacher' }, config);
            toast.success(`${teacherData.name} qo'shildi!`, { id: loadToast });
            setTeacherData({ ...teacherData, name: '', email: '', password: '' });
            fetchData();
        } catch (err) { toast.error(err.response?.data?.message || 'Xatolik', { id: loadToast }); }
    };
    const handleDeleteTeacher = async (id, name) => {
        if (!window.confirm(`${name}ni o'chirmoqchimisiz?`)) return;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const loadToast = toast.loading('O\'chirilmoqda...');
        try { await axios.delete(`${API_URL}/auth/teacher/${id}`, config); toast.success('O\'chirildi', { id: loadToast }); fetchData(); } catch (err) { toast.error('Xatolik', { id: loadToast }); }
    };
    const handleResetPassword = async (e) => {
        e.preventDefault();
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const loadToast = toast.loading('Parol yangilanmoqda...');
        try { await axios.post(`${API_URL}/auth/update-password`, { teacherId: resetData.id, newPassword: resetData.newPassword }, config); toast.success('Yangilandi!', { id: loadToast }); setShowResetModal(false); fetchData(); } catch (err) { toast.error('Xatolik', { id: loadToast }); }
    };

    // PORTED TEACHER LOGIC
    const handleAddSubject = async (e) => {
        e.preventDefault();
        if (!newSubjectName.trim()) return toast.error('Yo\'nalish nomini kiriting!');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const loadToast = toast.loading('Yo\'nalish yaratilmoqda...');
        try {
            await axios.post(`${API_URL}/subjects`, { name: newSubjectName }, config);
            toast.success('Yo\'nalish qo\'shildi', { id: loadToast });
            setNewSubjectName('');
            setShowAddSubject(false);
            fetchData();
        } catch (err) { toast.error(err.response?.data?.message || 'Xatolik', { id: loadToast }); }
    };

    const handleAssignTask = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.post(`${API_URL}/tasks`, {
                teacherId: taskData.teacherId,
                text: taskData.text,
                title: 'Yangi Vazifa'
            }, config);

            toast.success('Vazifa yuborildi');
            setShowTaskModal(false);
            setTaskData({ teacherId: '', teacherName: '', text: '' });
            fetchTasks();
            setSelectedTask(res.data);
            setShowTaskModal(true); // Open the chat modal now
        } catch (err) {
            toast.error(err.response?.data?.message || 'Xatolik');
        }
    };

    const handleSendChatMessage = async (e) => {
        e.preventDefault();
        if (!chatMessage.trim() || !selectedTask) return;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            const res = await axios.post(`${API_URL}/tasks/${selectedTask._id}/message`, { text: chatMessage }, config);
            setSelectedTask(res.data);
            setChatMessage('');
            fetchTasks();
        } catch (err) {
            toast.error('Xabar yuborishda xato');
        }
    };

    const handleUpdateTaskStatus = async (taskId, status) => {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            await axios.put(`${API_URL}/tasks/${taskId}/status`, { status }, config);
            fetchTasks();
            toast.success('Holat yangilandi');
        } catch (err) {
            toast.error('Xatolik');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Ushbu suhbatni o\'chirmoqchimisiz?')) return;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            await axios.delete(`${API_URL}/tasks/${taskId}`, config);
            toast.success('Suhbat o\'chirildi');
            if (selectedTask?._id === taskId) setSelectedTask(null);
            fetchTasks();
        } catch (err) {
            toast.error('O\'chirishda xatolik');
        }
    };

    const handleDeleteSubject = async (e, subjectName) => {
        e.stopPropagation();
        if (!window.confirm(`${subjectName} yo'nalishini o'chirmoqchimisiz?`)) return;

        const config = { headers: { Authorization: `Bearer ${token}` } };
        const loadToast = toast.loading('O\'chirilmoqda...');
        try {
            await axios.delete(`${API_URL}/subjects/${subjectName}`, config);
            toast.success('O\'chirildi', { id: loadToast });
            if (activeTab === 'departments' && selectedDept === subjectName) setSelectedDept(null);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Xatolik', { id: loadToast });
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!selectedSubject) return toast.error('Yo\'nalishni tanlang!');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            await axios.post(`${API_URL}/groups`, { name: newGroupName, subject: selectedSubject }, config);
            toast.success('Guruh yaratildi');
            setNewGroupName('');
            fetchData();
        } catch (err) { toast.error('Xatolik'); }
    };

    const handleDeleteGroup = async (id) => {
        if (!window.confirm('O\'chirilsinmi?')) return;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try { await axios.delete(`${API_URL}/groups/${id}`, config); toast.success('Guruh o\'chirildi'); fetchData(); } catch (err) { toast.error('Xatolik'); }
    };

    const handleAssignTest = async (groupId, testId) => {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            await axios.put(`${API_URL}/groups/${groupId}/assign-test`, { testId }, config);
            toast.success('Test biriktirildi');
            fetchData();
        } catch (err) { toast.error('Xatolik'); }
    };

    const handleViewGroup = async (group) => {
        setViewingGroup(group);
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            const res = await axios.get(`${API_URL}/students/group/${group._id}`, config);
            setGroupStudents(res.data);
        } catch (err) { toast.error('O\'quvchilarni yuklashda xato'); }
    };


    const handleDeleteStudent = async (id) => {
        if (!window.confirm('O\'quvchini o\'chirishga ishonchingiz komilmi?')) return;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try { await axios.delete(`${API_URL}/students/${id}`, config); toast.success('O\'quvchi o\'chirildi'); fetchData(); if (viewingGroup) handleViewGroup(viewingGroup); } catch (err) { toast.error('Xatolik'); }
    };

    const handleSendResult = async (student) => {
        toast.success(`${student.fullName} natijasi yuborildi (Simulyatsiya)`);
    };


    const handlePrint = () => {
        window.print();
    };

    const filteredTeachers = (stats.fTeachers || []).filter(t =>
        (t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.subject || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    const activeDeptData = stats.dStats.find(d => d.name === selectedDept);

    return (
        <div className="flex min-h-screen bg-[var(--bg-main)] relative overflow-hidden font-['Inter'] transition-colors duration-500">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)}></div>}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[var(--bg-sidebar)] text-white flex flex-col border-r border-slate-800 shadow-2xl transition-transform duration-300 font-['Inter'] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <div className="p-6 pb-0 flex-shrink-0">
                    <div className="mb-8 text-center">
                        <div
                            onClick={() => fetchData(true)}
                            className="w-24 h-24 bg-white rounded-[24px] flex items-center justify-center mx-auto mb-5 shadow-2xl border-4 border-slate-700/50 cursor-pointer hover:scale-105 active:scale-95 transition-all group"
                        >
                            <img src="/logo.jpg" alt="Logo" className="w-16 h-16 object-contain" />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Command Center</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 scrollbar-none space-y-1 pb-6">
                    <button onClick={() => { setActiveTab('overview'); setSelectedDept(null) }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-[#38BDF8] shadow-lg shadow-[#38BDF8]/20' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <LayoutDashboard size={18} /><span className="font-bold text-sm">{t.dashboard}</span>
                    </button>
                    <button onClick={() => { setActiveTab('departments'); setSelectedDept(null) }} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === 'departments' ? 'bg-[#38BDF8] shadow-lg shadow-[#38BDF8]/20' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <div className="flex items-center gap-3"><Database size={18} /><span className="font-bold text-sm">{t.departments}</span></div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === 'departments' ? 'bg-white text-[#38BDF8]' : 'bg-slate-700 text-slate-300'}`}>{subjects.length}</span>
                    </button>
                    <button onClick={() => { setActiveTab('teachers'); setSelectedDept(null) }} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === 'teachers' ? 'bg-[#38BDF8] shadow-lg shadow-[#38BDF8]/20' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <div className="flex items-center gap-3"><Users size={18} /><span className="font-bold text-sm">{t.teachers}</span></div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === 'teachers' ? 'bg-white text-[#38BDF8]' : 'bg-slate-700 text-slate-300'}`}>{teachers.length}</span>
                    </button>
                    <button onClick={() => { setActiveTab('topics'); setSelectedDept(null) }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'topics' ? 'bg-[#38BDF8] shadow-lg shadow-[#38BDF8]/20' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <BookOpen size={18} /><span className="font-bold text-sm">{t.test_topics || 'Testlar'}</span>
                    </button>
                    <button onClick={() => { setActiveTab('groups'); setSelectedDept(null) }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'groups' ? 'bg-[#38BDF8] shadow-lg shadow-[#38BDF8]/20' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <Users size={18} /><span className="font-bold text-sm">{t.groups}</span>
                    </button>
                    <button onClick={() => { setActiveTab('students'); setSelectedDept(null) }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'students' ? 'bg-[#38BDF8] shadow-lg shadow-[#38BDF8]/20' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <CheckCircle2 size={18} /><span className="font-bold text-sm">{t.active_students || 'O\'quvchilar'}</span>
                    </button>
                    <button onClick={() => { setActiveTab('results'); setSelectedDept(null) }} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === 'results' ? 'bg-[#38BDF8] shadow-lg shadow-[#38BDF8]/20' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <div className="flex items-center gap-3"><FileText size={18} /><span className="font-bold text-sm">{t.results}</span></div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-700 text-slate-300`}>{students.length}</span>
                    </button>
                    <button onClick={() => { setActiveTab('tasks'); setSelectedDept(null); }} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === 'tasks' ? 'bg-[#38BDF8] shadow-lg shadow-[#38BDF8]/20' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <div className="flex items-center gap-3"><MessageSquare size={18} /><span className="font-bold text-sm">Vazifalar & Chat</span></div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === 'tasks' ? 'bg-white text-[#38BDF8]' : 'bg-slate-700 text-slate-300'}`}>{tasks.filter(t => t.status === 'pending').length}</span>
                    </button>
                    <button onClick={() => { setActiveTab('settings'); setSelectedDept(null) }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-[#38BDF8] shadow-lg shadow-[#38BDF8]/20' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <Settings size={18} /><span className="font-bold text-sm">{t.settings}</span>
                    </button>
                </div>

                <div className="p-6 pt-3 border-t border-slate-700/50 space-y-3 flex-shrink-0 bg-[var(--bg-sidebar)] z-10">
                    <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-[#38BDF8] text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center">
                            {profileData.image ? <img src={profileData.image} alt="Profile" className="w-full h-full object-cover" /> : <User size={14} />}
                        </div>
                        <span className="font-bold text-xs truncate">{profileData.name || 'Admin'}</span>
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-[10px] font-black text-rose-400 border border-rose-400/10 rounded-xl hover:bg-rose-400/10 transition-all uppercase tracking-widest">
                        <LogOut size={12} /><span>{t.logout}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 lg:ml-64 p-4 lg:p-8 relative z-10 transition-all duration-300`}>
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 lg:mb-10 gap-4 lg:gap-6 bg-[var(--glass-bg)] backdrop-blur-2xl p-4 lg:p-6 rounded-[24px] lg:rounded-[32px] shadow-sm border border-[var(--glass-border)] transition-colors">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-[var(--text-main)] hover:bg-black/5 rounded-xl transition-colors"><Menu size={24} /></button>
                        <div>
                            <h2 className="text-xl lg:text-2xl font-black text-[var(--text-main)] uppercase tracking-tighter">
                                {activeTab === 'overview' && t.overview}
                                {activeTab === 'departments' && (selectedDept ? `${selectedDept} Analitikasi` : t.departments)}
                                {activeTab === 'teachers' && t.teachers}
                                {activeTab === 'topics' && (t.test_topics || 'Test Mavzulari')}
                                {activeTab === 'groups' && t.groups}
                                {activeTab === 'students' && (t.active_students || 'O\'quvchilar')}
                                {activeTab === 'results' && t.results}
                                {activeTab === 'settings' && t.settings}
                                {activeTab === 'profile' && t.cabinet}
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest">Live System Analytics</p>
                            </div>
                        </div>
                    </div>


                    <div className="flex items-center gap-4">
                        <div className="bg-[var(--bg-main)] p-1 rounded-2xl flex items-center gap-1 border border-[var(--border-main)]">
                            {['week', 'month', 'all'].map(period => (
                                <button key={period} onClick={() => setTimeFilter(period)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${timeFilter === period ? 'bg-[var(--bg-card)] text-[#38BDF8] shadow-md' : 'text-slate-400'}`}>
                                    {period === 'week' ? 'Hafta' : period === 'month' ? 'Oy' : 'Jami'}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => fetchData(true)} className={`p-4 bg-[var(--bg-card)] text-[#38BDF8] rounded-[20px] shadow-sm border border-[var(--border-main)] hover:shadow-xl hover:-translate-y-1 transition-all ${isRefreshing ? 'animate-spin' : 'active:scale-95'}`}>
                            <RefreshCw size={20} />
                        </button>
                    </div>
                </header>

                {/* OVERVIEW - ENHANCED BOSS VIEW */}
                {activeTab === 'overview' && (
                    <div className="space-y-10 animate-in fade-in zoom-in duration-500">
                        {/* Top Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                            {[
                                { label: t.studentsCount, value: stats.fStudents.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50', aos: 'fade-up' },
                                { label: t.qualityRate, value: `${stats.qualityRate}%`, icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50', aos: 'fade-up', delay: 100 },
                                { label: t.avgScore, value: stats.avgGlobalScore, icon: Award, color: 'text-amber-500', bg: 'bg-amber-50', aos: 'fade-up', delay: 200 },
                                { label: t.teachers, value: stats.fTeachers.length, icon: GraduationCap, color: 'text-indigo-500', bg: 'bg-indigo-50', aos: 'fade-up', delay: 300 },
                                { label: 'Top Ustoz', value: stats.mostActiveTeacher?.name?.split(' ')[0] || '---', icon: Star, color: 'text-purple-500', bg: 'bg-purple-50', aos: 'fade-up', delay: 400 }
                            ].map((card, idx) => (
                                <div key={idx} data-aos={card.aos} data-aos-delay={card.delay} className="bg-[var(--bg-card)] p-8 rounded-[40px] border border-[var(--border-main)] shadow-sm hover:shadow-xl transition-all group">
                                    <div className={`p-4 ${card.bg} ${card.color} rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform`}><card.icon size={24} /></div>
                                    <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest mb-1">{card.label}</p>
                                    <h3 className="text-4xl font-black text-[var(--text-main)] tracking-tighter truncate">{card.value}</h3>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                            {/* Main Stats Column */}
                            <div className="xl:col-span-2 space-y-10">
                                {/* Charts Area */}
                                <div className="bg-[var(--bg-card)] p-12 rounded-[56px] border border-[var(--border-main)] shadow-sm relative overflow-hidden group transition-colors" data-aos="fade-right">
                                    <div className="flex justify-between items-center mb-12">
                                        <h4 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tighter flex items-center gap-2"><BarChart3 className="text-[#38BDF8]" /> {t.departments} Analitikasi</h4>
                                        <TrendingUp size={20} className="text-emerald-400" />
                                    </div>
                                    <div className="h-80 flex items-end gap-8 border-b border-[var(--border-main)] pb-6 relative z-10">
                                        {stats.dStats.map((d, i) => (
                                            <div key={i} className="flex-1 group/bar relative flex flex-col items-center h-full justify-end cursor-pointer" onClick={() => { setActiveTab('departments'); setSelectedDept(d.name) }}>
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 w-48 bg-[#1E293B] text-white p-4 rounded-3xl opacity-0 group-hover/bar:opacity-100 scale-90 group-hover/bar:scale-100 transition-all z-50 shadow-2xl">
                                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{d.quality}% SIFAT</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{d.studentCount} o'quvchi</p>
                                                </div>
                                                <div className="w-full bg-gradient-to-t from-blue-500/10 to-[#38BDF8] rounded-2xl group-hover/bar:ring-8 group-hover/bar:ring-blue-500/5 transition-all duration-500 h-0" style={{ height: `${Math.max(Number(d.quality), 10)}%` }}></div>
                                                <span className="mt-4 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-tighter text-center group-hover/bar:text-[#38BDF8] transition-colors">{d.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="absolute top-0 right-0 p-12 pointer-events-none opacity-5 group-hover:rotate-12 transition-transform text-[var(--text-main)]"><Activity size={200} /></div>
                                </div>

                                {/* Departments Detail Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {stats.dStats.slice(0, 4).map((d, i) => (
                                        <div key={i} data-aos="zoom-in" data-aos-delay={i * 50} className="bg-[var(--bg-card)] p-8 rounded-[40px] border border-[var(--border-main)] shadow-sm hover:shadow-lg transition-all flex items-center gap-6">
                                            <div className="w-16 h-16 bg-blue-500/5 text-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0"><GraduationCap size={30} /></div>
                                            <div className="flex-1">
                                                <h5 className="font-black text-[var(--text-main)] uppercase text-xs tracking-tight">{d.name}</h5>
                                                <p className="text-[10px] text-[var(--text-muted)] font-bold">{d.studentCount} O'quvchi • {d.quality}% Sifat</p>
                                            </div>
                                            <div className="p-3 bg-emerald-500/10 rounded-xl"><ArrowRight size={14} className="text-emerald-500" /></div>
                                        </div>
                                    ))}
                                </div>

                                {/* RESTORED RECENT RESULTS TABLE */}
                                <div className="bg-[var(--bg-card)] rounded-[56px] border border-[var(--border-main)] shadow-sm overflow-hidden" data-aos="fade-up">
                                    <div className="p-10 border-b border-[var(--border-main)] bg-[var(--bg-main)] opacity-80 flex justify-between items-center">
                                        <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter flex items-center gap-2"><TrendingUp size={20} className="text-emerald-500" /> {t.latest_results || 'Yaqindagi Natijalar'}</h3>
                                        <button onClick={() => setActiveTab('results')} className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:underline">{t.all}</button>
                                    </div>
                                    <div className="overflow-x-auto p-4">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr>
                                                    <th className="p-4 text-[10px] font-black uppercase text-[var(--text-muted)]">{t.name}</th>
                                                    <th className="p-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-right">{t.score_ball.toUpperCase()}</th>
                                                    <th className="p-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-right">{t.status.toUpperCase()}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm font-bold text-[var(--text-main)]">
                                                {students.filter(s => s.status === 'checked').slice(0, 5).map((s, idx) => (
                                                    <tr key={s._id} data-aos="fade-left" data-aos-delay={idx * 50} className="border-b border-[var(--border-main)] last:border-0 hover:bg-[var(--bg-main)] transition-colors">
                                                        <td className="p-4">
                                                            <p className="font-bold">{s.fullName}</p>
                                                            <p className="text-[8px] text-[var(--text-muted)] uppercase tracking-widest">{s.chosenSubject}</p>
                                                        </td>
                                                        <td className="p-4 text-right"><span className="text-indigo-500">{s.score}</span></td>
                                                        <td className="p-4 text-right">
                                                            <button onClick={() => setViewingResultStudent(s)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"><Eye size={16} /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {students.filter(s => s.status === 'checked').length === 0 && (
                                                    <tr><td colSpan="3" className="p-8 text-center text-[var(--text-muted)] uppercase text-[10px] font-black tracking-widest">Natijalar yo'q</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Column: Leaderboard & Activities */}
                            <div className="xl:col-span-1 space-y-10">
                                {/* Top Students Leaderboard */}
                                <div className="bg-gradient-to-br from-[#1E293B] to-[#334155] p-10 rounded-[56px] text-white shadow-2xl relative overflow-hidden">
                                    <h4 className="text-lg font-black uppercase tracking-tighter mb-8 flex items-center gap-3"><Trophy className="text-amber-400" /> {t.topStudents}</h4>
                                    <div className="space-y-5 relative z-10">
                                        {stats.top5Students.map((st, i) => (
                                            <div key={st._id} className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl group hover:bg-white/10 transition-all">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-amber-400 text-slate-900 shadow-lg shadow-amber-400/20' : 'bg-white/10 text-white'}`}>{i + 1}</div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-black text-xs uppercase truncate">{st.fullName}</p>
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{st.chosenSubject}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-emerald-400">{st.score}%</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-8 pt-8 border-t border-white/10 text-center relative z-10">
                                        <button onClick={() => setActiveTab('results')} className="text-[10px] font-black uppercase tracking-[0.2em] text-[#38BDF8] hover:text-white transition-colors">Barcha natijalar <ArrowRight size={10} className="inline ml-1" /></button>
                                    </div>
                                    <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12"><Trophy size={150} /></div>
                                </div>

                                {/* System Activity Log */}
                                <div className="bg-[var(--bg-card)] rounded-[56px] border border-[var(--border-main)] shadow-sm overflow-hidden flex flex-col h-[500px]">
                                    <div className="p-8 border-b border-[var(--border-main)] bg-[var(--bg-main)] opacity-80 flex justify-between items-center">
                                        <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter flex items-center gap-2"><Activity size={20} className="text-emerald-500" /> Tizim Faolligi</h3>
                                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                                    </div>
                                    <div className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar">
                                        {stats.recentActivities.length > 0 ? stats.recentActivities.map((act, i) => (
                                            <div key={i} className="flex gap-4 group">
                                                <div className={`w-12 h-12 rounded-2xl ${act.bg} ${act.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm`}>
                                                    <act.icon size={20} />
                                                </div>
                                                <div className="flex-1 border-b border-[var(--border-main)] pb-6 last:border-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-tight">{act.title}</h4>
                                                        <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-[var(--text-muted)] line-clamp-2 leading-relaxed">{act.desc}</p>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] opacity-20 py-20">
                                                <Activity size={48} className="mb-4" />
                                                <p className="font-black uppercase tracking-widest text-[10px]">Hozircha faollik yo'q</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* DEPARTMENTS TAB - QUALITY FOCUS */}
                {activeTab === 'departments' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                        {!selectedDept ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {stats.dStats.map((d, i) => (
                                    <div key={i} onClick={() => setSelectedDept(d.name)} className="p-10 bg-[var(--bg-card)] shadow-sm border border-[var(--border-main)] rounded-[56px] hover:border-[#38BDF8]/40 hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden">
                                        <button
                                            onClick={(e) => handleDeleteSubject(e, d.name)}
                                            className="absolute top-6 right-6 p-3 bg-rose-500/10 text-rose-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white z-20"
                                            title="O'chirish"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <div className="flex justify-between items-start mb-8">
                                            <div className="bg-[var(--bg-main)] p-6 rounded-[32px] group-hover:bg-blue-50 group-hover:text-blue-600 transition-all text-[var(--text-main)]"><GraduationCap size={40} /></div>
                                            <div className="text-right"><p className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-1">{t.qualityRate}</p><p className="text-3xl font-black text-emerald-500">{d.quality}%</p></div>
                                        </div>
                                        <h4 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tighter mb-8">{d.name}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-[var(--bg-main)] p-5 rounded-3xl text-center"><p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">{t.studentsCount}</p><p className="text-2xl font-black text-[var(--text-main)]">{d.studentCount}</p></div>
                                            <div className="bg-[var(--bg-main)] p-5 rounded-3xl text-center border-l border-[var(--border-main)]"><p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">{t.avgScore}</p><p className="text-2xl font-black text-[#38BDF8]">{d.avgScore}%</p></div>
                                        </div>
                                    </div>
                                ))}
                                <div onClick={() => setShowAddSubject(true)} className="p-10 bg-[var(--bg-main)] border-2 border-dashed border-[var(--border-main)] rounded-[56px] hover:border-[#38BDF8] hover:bg-[var(--bg-card)] transition-all cursor-pointer flex flex-col items-center justify-center min-h-[380px] group">
                                    <Plus size={64} className="text-slate-300 group-hover:text-[#38BDF8] group-hover:scale-125 transition-all duration-500 mb-4" />
                                    <p className="text-[12px] font-black text-[var(--text-muted)] group-hover:text-[var(--text-main)] uppercase tracking-[0.2em] text-center">Yangi Yo'nalish<br />Qo'shish</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                                <button onClick={() => setSelectedDept(null)} className="flex items-center gap-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest bg-[var(--bg-card)] pr-8 pl-4 py-4 rounded-3xl shadow-sm border border-[var(--border-main)] hover:text-[#38BDF8] transition-all"><ChevronLeft size={18} /> {t.back}</button>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {activeDeptData?.teachers.map(tData => (
                                        <div key={tData._id} className="bg-[var(--bg-card)] p-10 rounded-[48px] border border-[var(--border-main)] shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                                            <div className="flex gap-6 mb-8 relative z-10">
                                                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-[32px] flex items-center justify-center text-[#38BDF8] font-black text-3xl shadow-inner group-hover:rotate-6 transition-transform">{tData.name[0]}</div>
                                                <div className="flex-1">
                                                    <h4 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight mb-1">{tData.name}</h4>
                                                    <p className="text-[10px] font-bold text-[var(--text-muted)] truncate">{tData.email}</p>
                                                    <div className="inline-flex mt-3 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-lg text-[8px] font-black uppercase">Active Teacher</div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 relative z-10">
                                                <div className="p-5 bg-[var(--bg-main)] rounded-[28px] text-center"><p className="text-[9px] font-black text-[var(--text-muted)] mb-1 uppercase tracking-widest">{t.tasks}</p><p className="text-xl font-black text-[var(--text-main)]">{tData.tasks?.length || 0}</p></div>
                                                <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-[28px] text-center"><p className="text-[9px] font-black text-[#38BDF8] mb-1 uppercase tracking-widest">{t.activity}</p><p className="text-xl font-black text-[var(--text-main)]">High</p></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TEACHERS TAB - ACADEMIC LIST */}
                {activeTab === 'teachers' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                            {/* ADD TEACHER FORM */}
                            <div className="xl:col-span-1">
                                <div className="bg-[var(--bg-card)] p-8 rounded-[48px] border border-[var(--border-main)] shadow-sm sticky top-6 transition-colors">
                                    <h3 className="text-xl font-black text-[var(--text-main)] mb-6 flex items-center gap-3 uppercase tracking-tighter">
                                        <div className="p-3 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-500/20"><UserPlus size={20} /></div>
                                        {t.addTeacher}
                                    </h3>
                                    <form onSubmit={handleAddTeacher} className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-3">{t.name}</label>
                                            <input type="text" placeholder="..." required className="w-full px-6 py-4 rounded-3xl border border-[var(--border-main)] bg-[var(--bg-main)] font-bold text-sm focus:bg-[var(--bg-card)] focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-[var(--text-main)]" value={teacherData.name} onChange={e => setTeacherData({ ...teacherData, name: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-3">{t.email}</label>
                                            <input type="email" placeholder="..." required className="w-full px-6 py-4 rounded-3xl border border-[var(--border-main)] bg-[var(--bg-main)] font-bold text-sm focus:bg-[var(--bg-card)] focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-[var(--text-main)]" value={teacherData.email} onChange={e => setTeacherData({ ...teacherData, email: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-3">{t.password}</label>
                                            <div className="relative">
                                                <input type={showPassword ? "text" : "password"} placeholder="..." required className="w-full px-6 py-4 rounded-3xl border border-[var(--border-main)] bg-[var(--bg-main)] font-bold text-sm focus:bg-[var(--bg-card)] focus:ring-4 focus:ring-indigo-500/10 transition-all pr-14 outline-none text-[var(--text-main)]" value={teacherData.password} onChange={e => setTeacherData({ ...teacherData, password: e.target.value })} />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors p-2">
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-3">{t.subject}</label>
                                            <div className="relative">
                                                <select
                                                    required
                                                    className="w-full pl-6 pr-12 py-4 rounded-3xl border border-[var(--border-main)] bg-[var(--bg-main)] font-bold text-sm focus:bg-[var(--bg-card)] focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none appearance-none text-[var(--text-main)]"
                                                    value={teacherData.subject}
                                                    onChange={e => setTeacherData({ ...teacherData, subject: e.target.value })}
                                                >
                                                    <option value="" disabled>Tanlang...</option>
                                                    {subjects.length > 0 ? (
                                                        subjects.map((sub, idx) => <option key={idx} value={sub}>{sub}</option>)
                                                    ) : (
                                                        <option value="" disabled>Yuklanmoqda...</option>
                                                    )}
                                                </select>
                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronLeft size={16} className="-rotate-90" /></div>
                                            </div>
                                        </div>
                                        <button type="submit" className="w-full py-5 bg-slate-800 dark:bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:shadow-xl hover:bg-emerald-500 transition-all active:scale-95 flex items-center justify-center gap-3 group mt-4">
                                            <Save size={18} className="group-hover:rotate-12 transition-transform" /> {t.save}
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* TEACHERS LIST */}
                            <div className="xl:col-span-2">
                                <div className="bg-[var(--bg-card)] rounded-[48px] border border-[var(--border-main)] shadow-sm overflow-hidden transition-colors">
                                    <div className="p-8 border-b border-[var(--border-main)] flex justify-between items-center bg-[var(--bg-main)] opacity-80">
                                        <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter">{t.all_teachers}</h3>
                                        <div className="relative">
                                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input type="text" placeholder="..." className="pl-12 pr-6 py-3 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-[var(--text-main)]" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8">
                                        {filteredTeachers.map(tData => (
                                            <div key={tData._id} className="p-8 bg-[var(--bg-main)] rounded-[40px] border border-[var(--border-main)] hover:shadow-xl transition-all group relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all flex gap-2">
                                                    <button onClick={() => { setTaskData({ ...taskData, teacherId: tData._id, teacherName: tData.name }); setShowTaskModal(true); }} className="p-3 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-110 active:scale-95 transition-all" title="Vazifa berish"><MessageSquarePlus size={18} /></button>
                                                    <button onClick={() => { setResetData({ ...resetData, id: tData._id, name: tData.name }); setShowResetModal(true); }} className="p-3 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/20 hover:scale-110 active:scale-95 transition-all" title="Parolni o'zgartirish"><Key size={18} /></button>
                                                    <button onClick={() => handleDeleteTeacher(tData._id, tData.name)} className="p-3 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/20 hover:scale-110 active:scale-95 transition-all" title="O'chirish"><Trash2 size={18} /></button>
                                                </div>
                                                <div className="flex items-center gap-6 mb-8 relative z-10">
                                                    <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black shadow-xl">{tData.name[0]}</div>
                                                    <div className="flex-1">
                                                        <h4 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight mb-1">{tData.name}</h4>
                                                        <p className="text-[10px] font-bold text-[var(--text-muted)] truncate">{tData.email}</p>
                                                        <div className="inline-flex mt-3 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-lg text-[8px] font-black uppercase">Active Teacher</div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 relative z-10">
                                                    <div className="p-5 bg-[var(--bg-main)] rounded-[28px] text-center">
                                                        <p className="text-[9px] font-black text-[var(--text-muted)] mb-1 uppercase tracking-widest">Guruhlar</p>
                                                        <p className="text-xl font-black text-[var(--text-main)]">{groups.filter(g => g.teacherId === tData._id || g.teacherId?._id === tData._id).length}</p>
                                                    </div>
                                                    <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-[28px] text-center">
                                                        <p className="text-[9px] font-black text-[#38BDF8] mb-1 uppercase tracking-widest">O'quvchilar</p>
                                                        <p className="text-xl font-black text-[var(--text-main)]">{students.filter(s => s.teacherId === tData._id || s.teacherId?._id === tData._id).length}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* TEST TOPICS TAB */}
                {activeTab === 'topics' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in zoom-in duration-500">
                        {activeTests.map(test => (
                            <div key={test._id} className="bg-[var(--bg-card)] p-8 rounded-[48px] border border-[var(--border-main)] hover:shadow-2xl transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all flex gap-2">
                                    <button onClick={async () => {
                                        const config = { headers: { Authorization: `Bearer ${token}` } };
                                        try {
                                            const res = await axios.get(`${API_URL}/tests/${test._id}`, config);
                                            setViewingTest(res.data);
                                        } catch (err) { toast.error('Yuklashda xatolik'); }
                                    }} className="p-3 bg-blue-500 text-white rounded-2xl hover:scale-110 transition-all"><Eye size={18} /></button>
                                    <button onClick={async () => { if (window.confirm('O\'chirilsinmi?')) { const config = { headers: { Authorization: `Bearer ${token}` } }; try { await axios.delete(`${API_URL}/tests/${test._id}`, config); toast.success('O\'chirildi'); fetchData(); } catch (err) { toast.error('Xatoplik'); } } }} className="p-3 bg-rose-500 text-white rounded-2xl hover:scale-110 transition-all"><Trash2 size={18} /></button>
                                </div>
                                <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-3xl flex items-center justify-center mb-6"><BookOpen size={30} /></div>
                                <h4 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight mb-2">{test.topic}</h4>
                                <div className="flex items-center gap-4 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest">
                                    <span>{test.count} Savol</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    <span>{test.subject}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* GROUPS TAB */}
                {activeTab === 'groups' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="lg:col-span-1 h-fit sticky top-8">
                            <div className="bg-[var(--bg-card)] p-10 rounded-[48px] border border-[var(--border-main)] shadow-sm">
                                <h3 className="text-xl font-black text-[var(--text-main)] uppercase mb-6 flex items-center gap-3"><Users size={20} className="text-blue-500" /> Yangi Guruh</h3>
                                <form onSubmit={handleCreateGroup} className="space-y-4">
                                    <select
                                        className="w-full px-6 py-4 rounded-3xl border border-[var(--border-main)] bg-[var(--bg-main)] font-bold text-sm outline-none text-[var(--text-main)] appearance-none"
                                        value={selectedSubject}
                                        onChange={e => setSelectedSubject(e.target.value)}
                                    >
                                        <option value="">Yo'nalish...</option>
                                        {subjects.map((sub, idx) => <option key={idx} value={sub}>{sub}</option>)}
                                    </select>
                                    <input type="text" required placeholder="Guruh nomi..." className="w-full px-6 py-4 rounded-3xl border border-[var(--border-main)] bg-[var(--bg-main)] font-bold text-sm outline-none text-[var(--text-main)]" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                                    <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all">Yaratish</button>
                                </form>
                            </div>
                            <div className="mt-8 bg-[var(--bg-card)] p-8 rounded-[40px] border border-[var(--border-main)]">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-3 mb-2 block">Filtrlash</label>
                                <select
                                    className="w-full px-6 py-4 rounded-3xl border border-[var(--border-main)] bg-[var(--bg-main)] font-bold text-sm outline-none text-[var(--text-main)] appearance-none"
                                    value={groupSubjectFilter}
                                    onChange={e => setGroupSubjectFilter(e.target.value)}
                                >
                                    <option value="">Barcha Yo'nalishlar</option>
                                    {subjects.map((sub, idx) => <option key={idx} value={sub}>{sub}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {groups.filter(g => !groupSubjectFilter || g.subject === groupSubjectFilter).map(g => (
                                <div key={g._id} className="bg-[var(--bg-card)] p-8 rounded-[48px] border border-[var(--border-main)] hover:shadow-xl transition-all group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center"><Users size={20} /></div>
                                            <div>
                                                <p className="font-black text-[var(--text-main)] uppercase text-sm">{g.name}</p>
                                                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase">{g.subject} • {g.teacherId?.name || 'Ustoz'}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteGroup(g._id)} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"><Trash2 size={16} /></button>
                                    </div>
                                    <div className="space-y-4">
                                        <select
                                            className="w-full px-4 py-3 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-main)] text-xs font-bold outline-none text-[var(--text-main)] appearance-none"
                                            value={g.assignedTest?._id || g.assignedTest || ''}
                                            onChange={(e) => handleAssignTest(g._id, e.target.value)}
                                        >
                                            <option value="">Test biriktirish...</option>
                                            {activeTests.map(t => <option key={t._id} value={t._id}>{t.topic} ({t.count})</option>)}
                                        </select>
                                        <button onClick={() => handleViewGroup(g)} className="w-full py-3 bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2"><Eye size={14} /> Ko'rish</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STUDENTS TAB */}
                {activeTab === 'students' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-10">
                        <div className="grid grid-cols-1 gap-8">
                            <div className="p-8 border-b border-[var(--border-main)] bg-[var(--bg-main)] opacity-80 flex justify-between items-center">
                                <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter">Ro'yxat</h3>
                                <div className="relative flex gap-2">
                                    <select className="px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl text-xs font-bold outline-none text-[var(--text-main)] w-40" value={studentGroupFilter} onChange={e => setStudentGroupFilter(e.target.value)}>
                                        <option value="">Barcha Guruhlar</option>
                                        {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                                    </select>
                                    <div className="relative">
                                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="text" placeholder="..." className="pl-12 pr-6 py-3 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl text-xs font-bold outline-none text-[var(--text-main)]" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto p-4">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr>
                                            <th className="p-4 text-[10px] font-black uppercase text-[var(--text-muted)]">ID</th>
                                            <th className="p-4 text-[10px] font-black uppercase text-[var(--text-muted)]">O'quvchi</th>
                                            <th className="p-4 text-[10px] font-black uppercase text-[var(--text-muted)]">Guruh / Yo'nalish</th>
                                            <th className="p-4 text-[10px] font-black uppercase text-[var(--text-muted)]">Natija</th>
                                            <th className="p-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-right">Amallar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm font-bold text-[var(--text-main)]">
                                        {students.filter(s => (s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || s.loginId.includes(searchQuery)) && (!studentGroupFilter || s.groupId === studentGroupFilter || s.groupId?._id === studentGroupFilter)).map(s => (
                                            <tr key={s._id} className="border-b border-[var(--border-main)] last:border-0 hover:bg-[var(--bg-main)] transition-colors">
                                                <td className="p-4 font-mono text-indigo-500">{s.loginId}</td>
                                                <td className="p-4">
                                                    <div>
                                                        <p className="font-bold">{s.fullName}</p>
                                                        <p className="text-[8px] text-[var(--text-muted)] uppercase tracking-widest">{s.teacherId?.name || 'Sistema'}</p>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div>
                                                        <p className="text-xs">{s.groupId?.name || 'Guruhsiz'}</p>
                                                        <p className="text-[8px] text-[var(--text-muted)] uppercase tracking-widest">{s.chosenSubject}</p>
                                                    </div>
                                                </td>
                                                <td className="p-4"><span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase ${s.status === 'checked' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{s.status === 'checked' ? `${s.score} ball` : 'Kutilmoqda'}</span></td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {s.status === 'checked' && (
                                                            <button onClick={() => setViewingResultStudent(s)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all" title="Batafsil ko'rish"><Eye size={16} /></button>
                                                        )}
                                                        <button onClick={() => handleDeleteStudent(s._id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all" title="O'chirish"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'results' && (
                    <div className="bg-[var(--bg-card)] rounded-[48px] border border-[var(--border-main)] overflow-hidden transition-colors shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-10 border-b border-[var(--border-main)] bg-[var(--bg-main)] opacity-80 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <h3 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tighter flex items-center gap-3">
                                    <TrendingUp className="text-emerald-500" /> {t.results}
                                </h3>
                                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">Barcha yo'nalishlar bo'yicha umumiy natijalar</p>
                            </div>
                            <div className="relative w-full md:w-auto">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="text" placeholder="Ism yoki ID..." className="w-full md:w-64 pl-12 pr-6 py-4 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-[var(--text-main)]" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                            </div>
                        </div>
                        <div className="overflow-x-auto p-4">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-[var(--border-main)]">
                                        <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">O'quvchi</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Yo'nalish</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] text-center">Savollar</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] text-center">Correct</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] text-right">Ball</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] text-right">Analiz</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-main)]">
                                    {students.filter(s => (s.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) || (s.loginId || '').includes(searchQuery)).map(s => (
                                        <tr key={s._id} className="hover:bg-blue-500/5 transition-all group">
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-indigo-500">{s.fullName?.[0]}</div>
                                                    <div>
                                                        <p className="font-black text-[var(--text-main)] text-sm">{s.fullName}</p>
                                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">ID: {s.loginId}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6"><span className="text-[10px] font-black uppercase text-[var(--text-muted)]">{s.chosenSubject}</span></td>
                                            <td className="p-6 text-center font-bold text-[var(--text-main)]">{s.testId?.count || '-'}</td>
                                            <td className="p-6 text-center">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${s.status === 'checked' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'}`}>
                                                    {s.status === 'checked' ? s.correctCount : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right"><span className={`text-xl font-black ${s.status === 'checked' ? 'text-indigo-500' : 'text-slate-400'}`}>{s.status === 'checked' ? s.score : '-'}</span></td>
                                            <td className="p-6 text-right">
                                                <button onClick={() => setViewingResultStudent(s)} className={`p-3 rounded-xl transition-all ${s.status === 'checked' ? 'bg-blue-500 text-white hover:shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`} disabled={s.status !== 'checked'}><Eye size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'tasks' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-250px)] animate-in fade-in zoom-in duration-500">
                        {/* Conversation List */}
                        <div className="lg:col-span-1 bg-[var(--bg-card)] rounded-[40px] border border-[var(--border-main)] flex flex-col overflow-hidden">
                            <div className="p-8 border-b border-[var(--border-main)] bg-[var(--bg-main)] opacity-80">
                                <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter">Suhbatlar</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {tasks.map((task) => (
                                    <div
                                        key={task._id}
                                        onClick={() => setSelectedTask(task)}
                                        className={`p-5 rounded-[32px] border cursor-pointer transition-all ${selectedTask?._id === task._id ? 'bg-blue-600 text-white border-blue-600 shadow-xl' : 'bg-[var(--bg-main)] border-[var(--border-main)] hover:border-blue-500/50 text-[var(--text-main)]'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2 group/task">
                                            <div>
                                                <h4 className="font-black text-sm uppercase truncate max-w-[120px]">{task.teacher?.name || 'Ustoz'}</h4>
                                                <p className={`text-[8px] font-black uppercase tracking-widest ${selectedTask?._id === task._id ? 'text-blue-100' : 'text-[var(--text-muted)]'}`}>
                                                    {task.title}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${task.status === 'completed' ? 'bg-emerald-500/20' : task.status === 'in_progress' ? 'bg-blue-500/20' : 'bg-amber-500/20'}`}>
                                                    {task.status}
                                                </span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteTask(task._id); }}
                                                    className={`p-1.5 rounded-lg opacity-0 group-hover/task:opacity-100 hover:bg-rose-500 hover:text-white transition-all ${selectedTask?._id === task._id ? 'text-blue-100' : 'text-rose-500'}`}
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className={`text-xs line-clamp-1 mb-2 ${selectedTask?._id === task._id ? 'text-blue-100' : 'text-[var(--text-muted)]'}`}>
                                            {task.messages[task.messages.length - 1]?.text}
                                        </p>
                                        <p className={`text-[8px] font-bold ${selectedTask?._id === task._id ? 'text-blue-200' : 'text-[var(--text-muted)]'}`}>
                                            {new Date(task.updatedAt).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                                {tasks.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] opacity-20 p-10">
                                        <MessageSquare size={48} className="mb-4" />
                                        <p className="font-black uppercase tracking-widest text-[10px]">Suhbatlar hali yo'q</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Chat Interface */}
                        <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-[48px] border border-[var(--border-main)] flex flex-col overflow-hidden relative">
                            {selectedTask ? (
                                <>
                                    <div className="p-8 border-b border-[var(--border-main)] bg-[var(--bg-main)] opacity-80 flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black">{selectedTask.teacher?.name?.[0]}</div>
                                            <div>
                                                <h4 className="font-black text-[var(--text-main)] uppercase tracking-tight">{selectedTask.teacher?.name}</h4>
                                                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Suhbat ochiq</p>
                                            </div>
                                        </div>
                                        <div className="flex bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-main)] gap-1">
                                            {['pending', 'in_progress', 'completed'].map(st => (
                                                <button
                                                    key={st}
                                                    onClick={() => handleUpdateTaskStatus(selectedTask._id, st)}
                                                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${selectedTask.status === st ? 'bg-blue-600 text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-black/5'}`}
                                                >
                                                    {st}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                                        {selectedTask.messages.map((msg, i) => (
                                            <div key={i} className={`flex flex-col ${msg.sender === 'admin' ? 'items-end' : 'items-start'}`}>
                                                <div className={`max-w-[70%] p-5 rounded-[28px] shadow-sm ${msg.sender === 'admin' ? 'bg-[#38BDF8] text-white rounded-tr-none' : 'bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-main)] rounded-tl-none'}`}>
                                                    <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                                                </div>
                                                <span className="text-[9px] font-black text-[var(--text-muted)] mt-2 px-2 uppercase tracking-tighter">
                                                    {msg.sender === 'admin' ? 'Siz (Admin)' : selectedTask.teacher?.name} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-6 bg-[var(--bg-main)] border-t border-[var(--border-main)]">
                                        <form onSubmit={handleSendChatMessage} className="flex gap-4 p-2 bg-[var(--bg-card)] rounded-[32px] border-2 border-[var(--border-main)] focus-within:border-blue-500/50 transition-all">
                                            <input
                                                type="text"
                                                placeholder="Suhbatni davom ettiring..."
                                                className="flex-1 bg-transparent border-none outline-none py-4 px-6 text-sm font-bold text-[var(--text-main)] placeholder:text-slate-400"
                                                value={chatMessage}
                                                onChange={(e) => setChatMessage(e.target.value)}
                                            />
                                            <button
                                                type="submit"
                                                className="p-4 bg-blue-600 text-white rounded-[24px] shadow-xl shadow-blue-500/20 hover:scale-[1.05] active:scale-95 transition-all"
                                            >
                                                <Send size={20} />
                                            </button>
                                        </form>
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] p-20 text-center opacity-30 select-none">
                                    <div className="p-10 bg-[var(--bg-main)] rounded-full mb-8"><MessageSquare size={80} /></div>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Chat Tanlanmagan</h3>
                                    <p className="text-sm font-bold max-w-sm">Chap tomondan biror ssuhbatni tanlang yoki Ustozlar bo'limidan yangi vazifa yuboring.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-[var(--bg-card)] rounded-[56px] border border-[var(--border-main)] shadow-sm overflow-hidden p-12 relative transition-colors">
                            <div className="flex flex-col md:flex-row gap-16 items-start">
                                <div className="relative group">
                                    <div className="w-56 h-56 rounded-[56px] overflow-hidden bg-[var(--bg-main)] border-[6px] border-[var(--bg-card)] shadow-2xl group-hover:opacity-80 transition-all flex items-center justify-center">
                                        {profileData.image ? (
                                            <img src={profileData.image} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={100} className="text-slate-300" />
                                        )}
                                    </div>
                                    <label className="absolute -bottom-4 -right-4 p-5 bg-[#38BDF8] text-white rounded-[28px] shadow-2xl cursor-pointer hover:scale-110 hover:rotate-6 active:scale-95 transition-all">
                                        <Camera size={28} /><input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                </div>

                                <div className="flex-1 space-y-10 w-full">
                                    <div>
                                        <span className="px-4 py-1.5 bg-blue-500/10 text-[#38BDF8] rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-500/20">Main Administrator</span>
                                        <h3 className="text-4xl font-black text-[var(--text-main)] tracking-tighter mt-4 leading-none">{profileData.name || 'System Admin'}</h3>
                                        <p className="text-[var(--text-muted)] font-bold text-sm mt-2">{profileData.email}</p>
                                    </div>

                                    <form onSubmit={handleUpdateProfile} className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-4">{t.name}</label>
                                                <input type="text" className="w-full px-8 py-5 rounded-[28px] border border-[var(--border-main)] bg-[var(--bg-main)] font-bold text-sm focus:bg-[var(--bg-card)] focus:ring-8 focus:ring-blue-500/5 transition-all outline-none text-[var(--text-main)]" value={profileData.name} onChange={e => setProfileData({ ...profileData, name: e.target.value })} />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-4">{t.email}</label>
                                                <input type="email" className="w-full px-8 py-5 rounded-[28px] border border-[var(--border-main)] bg-[var(--bg-main)] font-bold text-sm focus:bg-[var(--bg-card)] focus:ring-8 focus:ring-blue-500/5 transition-all outline-none text-[var(--text-main)]" value={profileData.email} onChange={e => setProfileData({ ...profileData, email: e.target.value })} />
                                            </div>
                                            <div className="space-y-3 lg:col-span-2">
                                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-4">{t.password}</label>
                                                <div className="relative">
                                                    <input type={showProfilePassword ? "text" : "password"} placeholder="..." className="w-full px-8 py-5 rounded-[28px] border border-[var(--border-main)] bg-[var(--bg-main)] font-bold text-sm focus:bg-[var(--bg-card)] focus:ring-8 focus:ring-blue-500/5 transition-all pr-20 outline-none text-[var(--text-main)]" value={profileData.password} onChange={e => setProfileData({ ...profileData, password: e.target.value })} />
                                                    <button type="button" onClick={() => setShowProfilePassword(!showProfilePassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-500 transition-colors p-2">
                                                        {showProfilePassword ? <EyeOff size={22} /> : <Eye size={22} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <button type="submit" className="w-full py-6 bg-slate-800 dark:bg-blue-600 text-white rounded-[32px] font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:shadow-2xl active:scale-95 transition-all outline-none border-none group">
                                            <Save size={20} className="group-hover:rotate-12 transition-transform" /> {t.save}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* MODALS */}
            {
                viewingGroup && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4" onClick={() => setViewingGroup(null)}>
                        <div className="bg-[var(--bg-card)] rounded-[48px] max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-[var(--border-main)]" onClick={e => e.stopPropagation()}>
                            <div className="p-8 border-b border-[var(--border-main)] flex justify-between items-center bg-[var(--bg-main)]">
                                <div><h3 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tighter">{viewingGroup.name}</h3><p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">{viewingGroup.subject}</p></div>
                                <button onClick={() => setViewingGroup(null)} className="p-3 bg-[var(--bg-main)] rounded-2xl text-slate-400 hover:text-rose-500 transition-all"><X size={24} /></button>
                            </div>
                            <div className="p-8 overflow-y-auto max-h-[calc(90vh-160px)]">
                                <div className="space-y-4">
                                    {groupStudents.map((s, i) => (
                                        <div key={s._id} className="p-4 bg-[var(--bg-main)] rounded-3xl border border-[var(--border-main)] flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white font-black">{i + 1}</div>
                                                <div><p className="font-bold text-[var(--text-main)] text-sm">{s.fullName}</p><p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">ID: {s.loginId}</p></div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase ${s.status === 'checked' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{s.status === 'checked' ? `${s.score} ball` : 'Kutilmoqda'}</span>
                                                <button onClick={() => handleDeleteStudent(s._id)} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                    {groupStudents.length === 0 && <p className="text-center text-[var(--text-muted)] py-10">O'quvchilar yo'q</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                viewingTest && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4" onClick={() => setViewingTest(null)}>
                        <div className="bg-[var(--bg-card)] rounded-[48px] max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-[var(--border-main)]" onClick={e => e.stopPropagation()}>
                            <div className="p-8 border-b border-[var(--border-main)] flex justify-between items-center bg-[var(--bg-main)]">
                                <div><h3 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tighter">{viewingTest.topic}</h3><p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">{viewingTest.subject}</p></div>
                                <button onClick={() => setViewingTest(null)} className="p-3 bg-[var(--bg-main)] rounded-2xl text-slate-400 hover:text-rose-500 transition-all"><X size={24} /></button>
                            </div>
                            <div className="p-8 overflow-y-auto max-h-[calc(90vh-160px)] space-y-6">
                                <div className="p-8 overflow-y-auto max-h-[calc(90vh-160px)] space-y-6">
                                    {viewingTest.questions && viewingTest.questions.length > 0 ? (
                                        viewingTest.questions.map((q, i) => (
                                            <div key={i} className="p-6 bg-[var(--bg-main)] rounded-3xl border border-[var(--border-main)]">
                                                <div className="flex justify-between items-start mb-4">
                                                    <p className="font-bold text-[var(--text-main)] text-sm">{i + 1}. {q.questionText || q.text}</p>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {q.options.map((opt, idx) => (
                                                        <div key={idx} className={`px-4 py-3 rounded-xl border text-xs font-bold ${idx === q.correctOption ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-main)]'}`}>
                                                            {opt} {idx === q.correctOption && '✅'}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-[var(--text-muted)] py-10">Savollar tahlili yuklanmoqda yoki mavjud emas.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* MODALS */}

            {
                showResetModal && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in duration-300">
                        <div className="bg-[var(--bg-card)] w-full max-w-md rounded-[56px] p-12 shadow-2xl relative overflow-hidden text-center border border-[var(--border-main)] transition-colors">
                            <div className="w-20 h-20 bg-blue-500/10 text-[#38BDF8] rounded-[32px] flex items-center justify-center mx-auto mb-8"><Key size={32} /></div>
                            <h3 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tighter mb-2">Parol Reset</h3>
                            <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-10">Ustoz: {resetData.name}</p>
                            <form onSubmit={handleResetPassword} className="space-y-6">
                                <input type="text" placeholder="..." required className="w-full px-8 py-5 rounded-3xl border border-[var(--border-main)] bg-[var(--bg-main)] font-black text-sm text-center focus:bg-[var(--bg-card)] outline-none text-[var(--text-main)]" value={resetData.newPassword} onChange={e => setResetData({ ...resetData, newPassword: e.target.value })} />
                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => setShowResetModal(false)} className="flex-1 py-5 bg-[var(--bg-main)] text-[var(--text-muted)] rounded-2xl font-black text-[10px] uppercase border border-[var(--border-main)]">Yopish</button>
                                    <button type="submit" className="flex-1 py-5 bg-[#38BDF8] text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-500/20">{t.save}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Add Subject Modal */}
            {
                showAddSubject && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowAddSubject(false)}>
                        <div className="bg-[var(--bg-card)] rounded-[40px] max-w-md w-full shadow-2xl border border-[var(--border-main)] p-10 animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner"><Plus size={40} /></div>
                                <h2 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tighter">Yangi Yo'nalish</h2>
                                <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest mt-2">{t.enter_details}</p>
                            </div>
                            <form onSubmit={handleAddSubject} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-3">Yo'nalish Nomi</label>
                                    <input type="text" autoFocus placeholder="Masalan: Matematika..." className="w-full px-6 py-5 rounded-[28px] border border-[var(--border-main)] bg-[var(--bg-main)] font-bold text-sm outline-none text-[var(--text-main)] focus:ring-4 focus:ring-emerald-500/10 transition-all" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <button type="button" onClick={() => setShowAddSubject(false)} className="py-4 rounded-[24px] font-black text-xs uppercase tracking-widest text-[var(--text-muted)] hover:bg-[var(--bg-main)] transition-all">{t.cancel}</button>
                                    <button type="submit" className="py-4 bg-emerald-500 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all">{t.save}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Task Assignment Modal */}
            {
                showTaskModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowTaskModal(false)}>
                        <div className="bg-[var(--bg-card)] rounded-[40px] max-w-md w-full shadow-2xl border border-[var(--border-main)] p-10 animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-blue-500/10 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner"><MessageSquarePlus size={40} /></div>
                                <h2 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tighter">Vazifa Berish</h2>
                                <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest mt-2">{taskData.teacherName} uchun</p>
                            </div>
                            <form onSubmit={handleAssignTask} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-3">Vazifa Matni</label>
                                    <textarea autoFocus placeholder="Vazifani yozing..." className="w-full px-6 py-5 rounded-[28px] border border-[var(--border-main)] bg-[var(--bg-main)] font-bold text-sm outline-none text-[var(--text-main)] focus:ring-4 focus:ring-blue-500/10 transition-all resize-none h-32" value={taskData.text} onChange={e => setTaskData({ ...taskData, text: e.target.value })} required />
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <button type="button" onClick={() => setShowTaskModal(false)} className="py-4 rounded-[24px] font-black text-xs uppercase tracking-widest text-[var(--text-muted)] hover:bg-[var(--bg-main)] transition-all">Bekor qilish</button>
                                    <button type="submit" className="py-4 bg-blue-500 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all">Yuborish</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Student Result Detailed Modal / Report - Admin Clone */}
            {
                viewingResultStudent && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] flex items-center justify-center p-4 print:p-0" onClick={() => setViewingResultStudent(null)}>
                        <div className="bg-[var(--bg-card)] rounded-[40px] max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-[var(--border-main)] flex flex-col print:shadow-none print:border-0 print:rounded-0 print:max-h-none print:static" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 border-b border-[var(--border-main)] flex justify-between items-center bg-gradient-to-r from-blue-600/5 to-indigo-600/5 print:hidden">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl"><FileText size={20} /></div>
                                    <h2 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter">{t.view_details}</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                                        <Plus className="rotate-45" size={14} style={{ transform: 'rotate(225deg)' }} /> {t.print}
                                    </button>
                                    <button onClick={() => setViewingResultStudent(null)} className="p-2 hover:bg-[var(--bg-main)] rounded-xl transition-all"><X size={20} className="text-[var(--text-muted)]" /></button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 print:overflow-visible print:p-0">
                                <div id="printable-report" className="space-y-12">
                                    <div className="text-center space-y-4">
                                        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-slate-100 print:border-2">
                                            <img src="/logo.jpg" alt="Logo" className="w-14 h-14 object-contain" />
                                        </div>
                                        <div>
                                            <h1 className="text-3xl font-black text-[var(--text-main)] uppercase tracking-tighter">{t.report_title}</h1>
                                            <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.3em]">{t.official_report}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
                                        <div className="p-6 bg-[var(--bg-main)] rounded-3xl border border-[var(--border-main)] space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{t.student_info}</span>
                                                <User size={14} className="text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-black text-[var(--text-main)]">{viewingResultStudent.fullName}</p>
                                                <p className="text-xs font-bold text-blue-500">{t.id_login}: {viewingResultStudent.loginId}</p>
                                                <p className="text-xs font-bold text-[var(--text-muted)] mt-1">{t.group}: {viewingResultStudent.groupId?.name || t.unassigned}</p>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-[var(--bg-main)] rounded-3xl border border-[var(--border-main)] space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{t.test_info}</span>
                                                <BookOpen size={14} className="text-indigo-500" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-black text-[var(--text-main)] truncate">{viewingResultStudent.testId?.topic || viewingResultStudent.chosenSubject}</p>
                                                <p className="text-xs font-bold text-indigo-500">{t.subject}: {viewingResultStudent.chosenSubject}</p>
                                                <p className="text-xs font-bold text-[var(--text-muted)] mt-1">{t.date}: {viewingResultStudent.updatedAt ? new Date(viewingResultStudent.updatedAt).toLocaleDateString(language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US') : new Date().toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-4 print:gap-2">
                                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl text-center">
                                            <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">{t.correct}</p>
                                            <p className="text-xl font-black text-emerald-600">{viewingResultStudent.correctCount || 0}</p>
                                        </div>
                                        <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl text-center">
                                            <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-1">{t.wrong}</p>
                                            <p className="text-xl font-black text-rose-600">{viewingResultStudent.wrongCount || 0}</p>
                                        </div>
                                        <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl text-center">
                                            <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-1">{t.time_spent}</p>
                                            <p className="text-xl font-black text-indigo-600">{viewingResultStudent.timeSpent || '00:00'}</p>
                                        </div>
                                        <div className="p-4 bg-blue-500 text-white rounded-2xl text-center shadow-lg shadow-blue-500/20">
                                            <p className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-80">{t.score_ball}</p>
                                            <p className="text-xl font-black">{viewingResultStudent.score}</p>
                                        </div>
                                    </div>

                                    {/* Answers Table Clone for Admin */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                                            <h3 className="text-sm font-black uppercase tracking-widest">{t.analysis}</h3>
                                            <div className="flex gap-4">
                                                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div><span className="text-[8px] font-bold uppercase">{t.correct}</span></div>
                                                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-rose-500 rounded-full"></div><span className="text-[8px] font-bold uppercase">{t.wrong}</span></div>
                                            </div>
                                        </div>
                                        <table className="w-full text-[10px]">
                                            <thead>
                                                <tr className="border-b border-slate-100"><th className="py-2 text-left w-10">#</th><th className="py-2 text-left">{t.questions}</th><th className="py-2 text-center w-32">{t.variant}</th><th className="py-2 text-right w-20">{t.status}</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {(viewingResultStudent.answers || []).map((ans, idx) => {
                                                    const q = ans.questionId;
                                                    const isCorrect = q ? q.options[q.correctOption] === ans.selectedOption : false;
                                                    return (
                                                        <tr key={idx} className="group">
                                                            <td className="py-3 font-bold text-slate-400">{idx + 1}</td>
                                                            <td className="py-3 font-bold text-slate-900 pr-4">{q?.text || 'Savollarni ko\'rish cheklangan'}</td>
                                                            <td className="py-3 text-center"><span className={`px-3 py-1 rounded-lg font-black ${isCorrect ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{ans.selectedOption}</span></td>
                                                            <td className="py-3 text-right">{isCorrect ? <CheckCircle2 size={14} className="text-emerald-500 ml-auto" /> : <X size={14} className="text-rose-500 ml-auto" />}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="pt-20 flex justify-end"><div className="text-center w-64 space-y-4"><div className="w-full border-b-2 border-slate-900"></div><p className="text-[10px] font-black uppercase tracking-widest">{t.signature}</p></div></div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-[var(--border-main)] bg-[var(--bg-main)] print:hidden">
                                <button onClick={() => setViewingResultStudent(null)} className="w-full py-3 bg-[var(--bg-card)] text-[var(--text-main)] rounded-[20px] font-bold text-sm border border-[var(--border-main)] hover:bg-[var(--bg-main)] transition-all">{t.cancel}</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};


export default AdminDashboard;
