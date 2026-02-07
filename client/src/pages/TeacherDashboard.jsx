import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { logout } from '../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import { translations } from '../utils/translations';
import toast from 'react-hot-toast';
import { API_URL } from '../utils/apiConfig';
import { LogOut, Plus, ClipboardList, BookOpen, Send, Clock, CheckCircle2, AlertCircle, Edit3, Trash2, Users, Eye, EyeOff, Save, MessageSquare, List, Check, X, Search, Camera, Settings, User, LayoutDashboard, TrendingUp, Award, Timer, FileText, Menu, ChevronLeft } from 'lucide-react';

const TeacherDashboard = () => {
    const { user, token } = useSelector((state) => state.auth);
    const { language } = useSelector((state) => state.ui);
    const t = translations[language];
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [qData, setQData] = useState({
        questionText: '',
        options: ['', '', '', ''],
        correctOption: 0,
    });

    const [myQuestions, setMyQuestions] = useState([]);
    const [activeTab, setActiveTab] = useState(localStorage.getItem('teacherActiveTab') || 'overview');
    const [profileData, setProfileData] = useState({ name: '', email: '', password: '', image: '' });
    const [showProfilePassword, setShowProfilePassword] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Test Builder State
    const [topicName, setTopicName] = useState('');
    const [builderQuestions, setBuilderQuestions] = useState([]); // List of questions for the current test
    const [isBuilding, setIsBuilding] = useState(false);

    // New State for Groups
    const [activeTests, setActiveTests] = useState([]);
    const [groups, setGroups] = useState([]);
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedGroup, setSelectedGroup] = useState(null); // For future use
    const [selectedTestId, setSelectedTestId] = useState(''); // To append questions to existing test
    const [viewingTest, setViewingTest] = useState(null); // For viewing test details
    const [testQuestions, setTestQuestions] = useState([]); // Questions in the viewing test
    const [viewingGroup, setViewingGroup] = useState(null); // For viewing group details
    const [groupStudents, setGroupStudents] = useState([]); // Students in the viewing group

    const [students, setStudents] = useState([]);
    const [newStudentName, setNewStudentName] = useState('');
    const [studentSearchQuery, setStudentSearchQuery] = useState('');
    const [studentStatusFilter, setStudentStatusFilter] = useState('all'); // all, pending, checked
    const [viewingResultStudent, setViewingResultStudent] = useState(null); // Added missing state

    // Task & Chat State
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [chatMessage, setChatMessage] = useState('');
    const [statsTimeFilter, setStatsTimeFilter] = useState('all'); // all, weekly, monthly
    const [editingGroup, setEditingGroup] = useState(null);
    const [editGroupName, setEditGroupName] = useState('');

    // Early Access Approval State
    const [pendingApprovals, setPendingApprovals] = useState([]);

    useEffect(() => {
        localStorage.setItem('teacherActiveTab', activeTab);
    }, [activeTab]);

    const [adminInfo, setAdminInfo] = useState({ name: 'Admin', image: null });

    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };

    const handleError = (err) => {
        console.error(err);
        if (err.response?.status === 401 || err.response?.status === 403 || err.response?.status === 404 || err.response?.status === 400) {
            dispatch(logout());
            window.location.href = '/login';
        }
    };

    const fetchQuestions = async () => {
        try {
            const res = await axios.get(`${API_URL}/questions/manage/${user?.subject}`, config);
            setMyQuestions(res.data);
        } catch (err) { handleError(err); }
    };

    const fetchStudents = async () => {
        try {
            const res = await axios.get(`${API_URL}/students/mine`, config);
            setStudents(res.data);
        } catch (err) { handleError(err); }
    };

    const fetchTests = async () => {
        try {
            const res = await axios.get(`${API_URL}/tests`, config);
            setActiveTests(res.data);
        } catch (err) { handleError(err); }
    };

    const fetchGroups = async () => {
        try {
            const res = await axios.get(`${API_URL}/groups`, config);
            setGroups(res.data);
        } catch (err) { handleError(err); }
    };

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${API_URL}/auth/profile`, config);
            setProfileData({ ...res.data, password: '' });
        } catch (err) { handleError(err); }
    };

    const fetchTasks = async () => {
        try {
            const res = await axios.get(`${API_URL}/tasks`, config);
            setTasks(res.data);
            if (selectedTask) {
                const updated = res.data.find(t => t._id === selectedTask._id);
                if (updated) setSelectedTask(updated);
            }
        } catch (err) { handleError(err); }
    };

    const fetchPendingApprovals = async () => {
        try {
            const res = await axios.get(`${API_URL}/students/pending-approvals`, config);
            setPendingApprovals(res.data);
        } catch (err) { handleError(err); }
    };

    const handleApproveEarlyAccess = async (studentId, approved) => {
        const loadToast = toast.loading(approved ? 'Tasdiqlanmoqda...' : 'Rad etilmoqda...');
        try {
            await axios.post(`${API_URL}/students/approve-early-access/${studentId}`, { approved }, config);
            toast.success(approved ? 'Tasdiqlandi!' : 'Rad etildi', { id: loadToast });
            fetchPendingApprovals();
        } catch (err) {
            toast.error('Xatolik: ' + (err.response?.data?.message || err.message), { id: loadToast });
        }
    };

    const handleViewTest = async (test) => {
        try {
            setViewingTest(test);
            // Fetch questions for this test
            const res = await axios.get(`${API_URL}/tests/${test._id}`, config);
            setTestQuestions(res.data.questions || []);
        } catch (err) {
            toast.error('Savollarni yuklashda xato');
        }
    };

    const handleDeleteTest = async (testId, e) => {
        e.stopPropagation(); // Prevent opening modal
        if (!window.confirm('Haqiqatan ham bu testni o\'chirmoqchimisiz?')) return;

        try {
            await axios.delete(`${API_URL}/tests/${testId}`, config);
            toast.success('Test o\'chirildi');
            fetchTests();
        } catch (err) {
            toast.error('Xatolik: ' + err.message);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    useEffect(() => {
        if (user?.subject && token) {
            fetchQuestions();
            fetchStudents();
            fetchTests();
            fetchGroups();
            fetchPendingApprovals();
        }
        if (token) {
            fetchProfile();
            fetchTasks();
            const taskInterval = setInterval(fetchTasks, 5000); // Polling for chat

            // Fecth Admin Info
            axios.get(`${API_URL}/auth/admin-info`, config)
                .then(res => setAdminInfo(res.data))
                .catch(err => console.log('Admin info fetch error', err));

            return () => clearInterval(taskInterval);
        }
    }, [user, token]);

    useEffect(() => {
        import('aos').then(AOS => AOS.refresh());
    }, [activeTab, students, activeTests, groups, tasks]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
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

    const handleAddQuestionToTest = async (e) => {
        e.preventDefault();

        if (!topicName && !selectedTestId) {
            toast.error('Avval test mavzusini kiriting yoki tanlang!');
            return;
        }

        if (editingId) {
            // Update existing question in builder
            const updatedQuestions = builderQuestions.map(q =>
                q._id === editingId ? { ...qData, _id: editingId } : q
            );
            setBuilderQuestions(updatedQuestions);
            toast.success('Savol yangilandi');
            setEditingId(null);
        } else {
            // Add new question
            const newQuestion = { ...qData, _id: Date.now().toString() }; // Temp ID
            setBuilderQuestions([...builderQuestions, newQuestion]);
            toast.success('Savol qo\'shildi. Keyingisini kiriting.');
        }

        setQData({ questionText: '', options: ['', '', '', ''], correctOption: 0 });
    };

    const handleEditBuilderQuestion = (q) => {
        setQData({
            questionText: q.questionText,
            options: [...q.options],
            correctOption: q.correctOption
        });
        setEditingId(q._id);
    };

    const handleDeleteBuilderQuestion = (id) => {
        setBuilderQuestions(builderQuestions.filter(q => q._id !== id));
        if (editingId === id) {
            setEditingId(null);
            setQData({ questionText: '', options: ['', '', '', ''], correctOption: 0 });
        }
    };

    const handleSaveTest = async () => {
        if (builderQuestions.length === 0) return toast.error('Savollar yo\'q');
        if (!selectedTestId && !topicName) return toast.error('Mavzu nomini kiriting yoki testni tanlang');

        const loadToast = toast.loading(selectedTestId ? 'Savollar qo\'shilmoqda...' : 'Test saqlanmoqda...');
        try {
            // 1. Save all questions first
            const questionIds = [];
            for (let q of builderQuestions) {
                const { _id, ...qContent } = q;
                const res = await axios.post(`${API_URL}/questions`, { ...qContent, subject: user.subject }, config);
                questionIds.push(res.data._id);
            }

            // 2. Either Create New, or Append to Existing
            if (selectedTestId) {
                // Append
                await axios.put(`${API_URL}/tests/${selectedTestId}/add`, {
                    questions: questionIds
                }, config);
                toast.success('Savollar mavjud testga qo\'shildi!', { id: loadToast });
            } else {
                // Create New
                await axios.post(`${API_URL}/tests`, {
                    topic: topicName,
                    questions: questionIds,
                    subject: user.subject,
                    count: questionIds.length
                }, config);
                toast.success('Yangi test yaratildi!', { id: loadToast });
            }

            setTopicName('');
            setSelectedTestId('');
            setBuilderQuestions([]);
            fetchQuestions();
            fetchTests();
            setActiveTab('topics'); // Switch to Test Topics tab
        } catch (err) {
            toast.error('Xatolik: ' + err.message, { id: loadToast });
        }
    };

    const handleEdit = (q) => {
        setQData({
            questionText: q.questionText,
            options: [...q.options],
            correctOption: q.correctOption
        });
        setEditingId(q._id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Haqiqatan ham o\'chirmoqchimisiz?')) return;
        try {
            await axios.delete(`${API_URL}/questions/${id}`, config);
            toast.success('Savol o\'chirildi');
            fetchQuestions();
        } catch (err) {
            toast.error('Xatolik');
        }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        const loadToast = toast.loading('O\'quvchi qo\'shilmoqda...');
        try {
            await axios.post(`${API_URL}/students`, {
                fullName: newStudentName,
                chosenSubject: user.subject,
                groupId: selectedGroup
            }, config);
            toast.success('O\'quvchi qo\'shildi!', { id: loadToast });
            setNewStudentName('');
            setSelectedGroup(null);
            fetchStudents();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Xatolik', { id: loadToast });
        }
    };

    const handleAssignTest = async (groupId, testId) => {
        try {
            await axios.put(`${API_URL}/groups/${groupId}/assign-test`, { testId }, config);
            toast.success('Test guruhga biriktirildi!');
            fetchGroups(); // Refresh groups to show updated assignment
        } catch (err) {
            toast.error('Xatolik: ' + err.message);
        }
    };

    const handleViewGroup = async (group) => {
        try {
            setViewingGroup(group);
            // Fetch students in this group
            const res = await axios.get(`${API_URL}/students/group/${group._id}`, config);
            setGroupStudents(res.data);
        } catch (err) {
            toast.error('O\'quvchilarni yuklashda xato');
        }
    };

    const handleDeleteStudent = async (id) => {
        if (!window.confirm('Haqiqatan ham bu o\'quvchini o\'chirmoqchimisiz?')) return;
        try {
            await axios.delete(`${API_URL}/students/${id}`, config);
            toast.success('O\'quvchi o\'chirildi');
            fetchStudents();
        } catch (err) { console.error(err); }
    };

    const handleSendResult = (student) => {
        toast.success(`${student.fullName} natijasi yuborildi!`);
    };

    const handleSendChatMessage = async (e) => {
        e.preventDefault();
        if (!chatMessage.trim() || !selectedTask) return;

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
        try {
            await axios.put(`${API_URL}/tasks/${taskId}/status`, { status }, config);
            fetchTasks();
            toast.success('Holat yangilandi');
        } catch (err) {
            toast.error('Xatolik');
        }
    };

    const stats = useMemo(() => {
        const now = new Date();
        const fResults = students.filter(s => {
            if (s.status !== 'checked') return false;
            if (statsTimeFilter === 'all') return true;
            const submissionDate = new Date(s.updatedAt || s.createdAt);
            const diffDays = (now - submissionDate) / (1000 * 60 * 60 * 24);
            if (statsTimeFilter === 'weekly') return diffDays <= 7;
            if (statsTimeFilter === 'monthly') return diffDays <= 30;
            return true;
        });

        const fStudents = students.filter(s => {
            if (statsTimeFilter === 'all') return true;
            const createdAt = new Date(s.createdAt);
            const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24);
            if (statsTimeFilter === 'weekly') return diffDays <= 7;
            if (statsTimeFilter === 'monthly') return diffDays <= 30;
            return true;
        });

        const fTests = activeTests.filter(t => {
            if (statsTimeFilter === 'all') return true;
            const createdAt = new Date(t.createdAt);
            const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24);
            if (statsTimeFilter === 'weekly') return diffDays <= 7;
            if (statsTimeFilter === 'monthly') return diffDays <= 30;
            return true;
        });

        const avgScore = fResults.length > 0 ? (fResults.reduce((acc, s) => acc + s.score, 0) / fResults.length).toFixed(1) : 0;
        const passThreshold = 60;
        const passedCount = fResults.filter(s => (s.score || 0) >= passThreshold).length;
        const qualityRate = fResults.length > 0 ? ((passedCount / fResults.length) * 100).toFixed(0) : 0;

        return { fResults, fStudents, fTests, avgScore, qualityRate };
    }, [students, activeTests, statsTimeFilter]);

    const filteredStatsData = stats.fResults;

    const handleUpdateGroup = async (e) => {
        e.preventDefault();
        if (!editingGroup || !editGroupName.trim()) return;
        try {
            await axios.put(`${API_URL}/groups/${editingGroup._id}`, { name: editGroupName }, config);
            toast.success('Guruh nomi yangilandi');
            setEditingGroup(null);
            setEditGroupName('');
            fetchGroups();
        } catch (err) {
            toast.error('Xatolik: ' + err.message);
        }
    };

    // New Handlers
    const handleCreateTest = async (e) => {
        e.preventDefault();
        const loadToast = toast.loading('Test ID olinmoqda...');
        try {
            await axios.post(`${API_URL}/tests`, { ...testData, subject: user.subject }, config);
            toast.success('Test yaratildi! ID nusxalandi.', { id: loadToast });
            setTestData({ topic: '', count: 10 });
            fetchTests();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Xatolik', { id: loadToast });
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        const loadToast = toast.loading('Guruh yaratilmoqda...');
        try {
            await axios.post(`${API_URL}/groups`, { name: newGroupName, subject: user.subject }, config);
            toast.success('Guruh yaratildi!', { id: loadToast });
            setNewGroupName('');
            fetchGroups();
        } catch (err) {
            toast.error('Xatolik', { id: loadToast });
        }
    };

    const handleDeleteGroup = async (id) => {
        if (!window.confirm('Guruhni o\'chirmoqchimisiz?')) return;
        try {
            await axios.delete(`${API_URL}/groups/${id}`, config);
            toast.success('Guruh o\'chirildi');
            fetchGroups();
        } catch (err) { toast.error('Xatolik'); }
    };

    const handleCancelEdit = () => {
        setQData({ questionText: '', options: ['', '', '', ''], correctOption: 0 });
        setEditingId(null);
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...qData.options];
        newOptions[index] = value;
        setQData({ ...qData, options: newOptions });
    };

    const handleLogout = () => {
        dispatch(logout());
        toast.success('Xayr, Ustoz!');
        navigate('/login');
    };

    return (
        <div className="flex min-h-screen bg-[var(--bg-main)] transition-colors duration-500 font-['Inter']">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)}></div>}

            {/* Sidebar (Compact for Teachers) */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[var(--bg-sidebar)] text-white p-6 flex flex-col border-r border-slate-800 shadow-2xl transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div className="mb-10 text-center">
                    <div
                        onClick={() => fetchQuestions()}
                        className="w-24 h-24 bg-white rounded-[24px] flex items-center justify-center mx-auto mb-5 shadow-2xl border-4 border-slate-700/50 cursor-pointer hover:scale-105 active:scale-95 transition-all group"
                    >
                        <img src="/logo.jpg" alt="Logo" className="w-16 h-16 object-contain" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{t.teacher_panel}</p>
                </div>

                <nav className="space-y-2 mb-8">
                    <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-[#38BDF8] shadow-lg shadow-[#38BDF8]/20 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <LayoutDashboard size={18} /><span className="font-bold text-sm">{t.statistika}</span>
                    </button>
                    <button onClick={() => setActiveTab('questions')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'questions' ? 'bg-[#38BDF8] shadow-lg shadow-[#38BDF8]/20 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <ClipboardList size={18} /><span className="font-bold text-sm">{t.test_builder}</span>
                    </button>
                    <button onClick={() => setActiveTab('topics')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'topics' ? 'bg-[#38BDF8] shadow-lg shadow-[#38BDF8]/20 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <BookOpen size={18} /><span className="font-bold text-sm">{t.test_topics}</span>
                    </button>
                    <button onClick={() => setActiveTab('groups')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'groups' ? 'bg-[#38BDF8] shadow-lg shadow-[#38BDF8]/20 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <Users size={18} /><span className="font-bold text-sm">{t.groups}</span>
                    </button>
                    <button onClick={() => setActiveTab('students')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'students' ? 'bg-[#38BDF8] shadow-lg shadow-[#38BDF8]/20 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <CheckCircle2 size={18} /><span className="font-bold text-sm">{t.active_students}</span>
                    </button>
                    <button onClick={() => setActiveTab('approvals')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'approvals' ? 'bg-[#38BDF8] shadow-lg shadow-[#38BDF8]/20 text-white' : 'text-slate-400 hover:bg-slate-800'} relative`}>
                        <div className="relative">
                            <Clock size={18} />
                            {pendingApprovals.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-[var(--bg-sidebar)] animate-pulse"></span>}
                        </div>
                        <span className="font-bold text-sm">Ruxsat So'rovlari</span>
                        {pendingApprovals.length > 0 && <span className="ml-auto bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md">{pendingApprovals.length}</span>}
                    </button>
                    <button onClick={() => setShowTaskModal(true)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-slate-400 hover:bg-slate-800 relative group`}>
                        <div className="relative">
                            <MessageSquare size={18} className="group-hover:text-[#38BDF8] transition-colors" />
                            {tasks.some(t => t.status === 'pending') && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[var(--bg-sidebar)] animate-pulse"></span>}
                        </div>
                        <span className="font-bold text-sm group-hover:text-[#38BDF8] transition-colors">Vazifalar</span>
                        {tasks.filter(t => t.status === 'pending').length > 0 && <span className="ml-auto bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md">{tasks.filter(t => t.status === 'pending').length}</span>}
                    </button>
                    <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-[#38BDF8] shadow-lg shadow-[#38BDF8]/20 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <Settings size={18} /><span className="font-bold text-sm">{t.settings}</span>
                    </button>
                </nav>

                <div className="absolute bottom-10 left-6 right-6 pt-6 border-t border-white/10 space-y-3 flex-shrink-0 bg-[var(--bg-sidebar)] z-10">
                    <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${activeTab === 'profile' ? 'bg-[#38BDF8] text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-700 flex items-center justify-center border-2 border-slate-600 shadow-inner">
                            {profileData.image ? (
                                <img src={profileData.image} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-emerald-500 flex items-center justify-center text-xs font-black text-white">{profileData.name?.[0] || user?.name?.[0]}</div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                            <span className="block font-black text-xs truncate leading-tight">{profileData.name || user?.name}</span>
                            <span className="block text-[8px] font-black uppercase text-slate-500 tracking-tighter mt-1">{user?.subject || 'O\'qituvchi'}</span>
                        </div>
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-[10px] font-black text-rose-400 border border-rose-400/10 rounded-xl hover:bg-rose-400/10 transition-all uppercase tracking-widest">
                        <LogOut size={12} /><span>{t.logout}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto relative z-10 transition-all duration-300">
                {activeTab === 'overview' && (
                    <div className="animate-in fade-in zoom-in duration-500 flex flex-col gap-6 md:gap-10">
                        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[var(--bg-card)] p-4 md:p-6 rounded-[24px] md:rounded-[32px] shadow-sm border border-[var(--border-main)] transition-colors gap-4 md:gap-6">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-[var(--text-main)] hover:bg-black/5 rounded-xl transition-colors"><Menu size={24} /></button>
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-black text-[var(--text-main)] uppercase tracking-tighter">{t.statistika}</h2>
                                    <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mt-1">{t.activity}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-[var(--bg-main)] p-1 rounded-2xl flex items-center gap-1 border border-[var(--border-main)] mr-2">
                                    {[
                                        { id: 'all', label: t.all },
                                        { id: 'weekly', label: t.weekly },
                                        { id: 'monthly', label: t.monthly }
                                    ].map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => setStatsTimeFilter(f.id)}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statsTimeFilter === f.id ? 'bg-[var(--bg-card)] text-[#38BDF8] shadow-md' : 'text-slate-400'}`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="h-10 w-[1px] bg-[var(--border-main)] mx-2 hidden lg:block"></div>

                                <div
                                    onClick={() => setActiveTab('profile')}
                                    className="flex items-center gap-3 px-3 py-2 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] cursor-pointer hover:shadow-lg transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner group-hover:scale-105 transition-transform">
                                        {profileData.image ? (
                                            <img src={profileData.image} alt="Teacher" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-emerald-500 font-black text-xs">{profileData.name?.[0] || user?.name?.[0]}</div>
                                        )}
                                    </div>
                                    <div className="hidden sm:block text-left">
                                        <p className="text-[11px] font-black text-[var(--text-main)] leading-none uppercase">{profileData.name || user?.name}</p>
                                        <p className="text-[8px] font-black text-emerald-500 uppercase mt-1">Ustoz</p>
                                    </div>
                                </div>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-[var(--bg-card)] p-8 rounded-[40px] border border-[var(--border-main)] shadow-sm hover:shadow-xl transition-all group overflow-hidden relative" data-aos="fade-up">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150"></div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl"><Users size={24} /></div>
                                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{t.studentsCount}</span>
                                </div>
                                <h4 className="text-4xl font-black text-[var(--text-main)] tracking-tighter">{stats.fStudents.length}</h4>
                                <p className="text-xs font-bold text-emerald-500 mt-2 flex items-center gap-1"><TrendingUp size={12} /> {t.active_students}</p>
                            </div>

                            <div className="bg-[var(--bg-card)] p-8 rounded-[40px] border border-[var(--border-main)] shadow-sm hover:shadow-xl transition-all group overflow-hidden relative" data-aos="fade-up" data-aos-delay="100">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150"></div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl"><ClipboardList size={24} /></div>
                                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{t.test_topics}</span>
                                </div>
                                <h4 className="text-4xl font-black text-[var(--text-main)] tracking-tighter">{stats.fTests.length}</h4>
                                <p className="text-xs font-bold text-blue-500 mt-2 flex items-center gap-1">{t.create_base}</p>
                            </div>

                            <div className="bg-[var(--bg-card)] p-8 rounded-[40px] border border-[var(--border-main)] shadow-sm hover:shadow-xl transition-all group overflow-hidden relative" data-aos="fade-up" data-aos-delay="200">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150"></div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl"><Award size={24} /></div>
                                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{t.avgScore}</span>
                                </div>
                                <h4 className="text-4xl font-black text-[var(--text-main)] tracking-tighter">
                                    {stats.avgScore}
                                </h4>
                                <p className="text-xs font-bold text-emerald-500 mt-2 flex items-center gap-1">{t.qualityRate}: {stats.qualityRate}%</p>
                            </div>

                            <div className="bg-[var(--bg-card)] p-8 rounded-[40px] border border-[var(--border-main)] shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150"></div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl"><Timer size={24} /></div>
                                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{t.submitted}</span>
                                </div>
                                <h4 className="text-4xl font-black text-[var(--text-main)] tracking-tighter">
                                    {stats.fResults.length}
                                </h4>
                                <p className="text-xs font-bold text-amber-500 mt-2 flex items-center gap-1">{t.date}</p>
                            </div>
                        </div>

                        <div className="bg-[var(--bg-card)] rounded-[48px] border border-[var(--border-main)] overflow-hidden shadow-sm">
                            <div className="p-8 border-b border-[var(--border-main)] bg-[var(--bg-main)] opacity-80 flex justify-between items-center">
                                <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter">{t.latest_results}</h3>
                                <button onClick={() => setActiveTab('students')} className="text-xs font-black text-blue-500 uppercase tracking-widest hover:underline">{t.all}</button>
                            </div>
                            <div className="p-4 overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr>
                                            <th className="p-4 text-[10px] font-black uppercase text-[var(--text-muted)]">{t.name}</th>
                                            <th className="p-4 text-[10px] font-black uppercase text-[var(--text-muted)]">{t.group}</th>
                                            <th className="p-4 text-[10px] font-black uppercase text-[var(--text-muted)]">{t.subject}</th>
                                            <th className="p-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-center">{t.correct}</th>
                                            <th className="p-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-center">{t.wrong}</th>
                                            <th className="p-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-center">{t.time_spent}</th>
                                            <th className="p-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-right">{t.score_ball.toUpperCase()}</th>
                                            <th className="p-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-right">{t.status}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm font-bold text-[var(--text-main)]">
                                        {filteredStatsData.slice(0, 5).map(s => (
                                            <tr key={s._id} className="border-b border-[var(--border-main)] last:border-0 hover:bg-[var(--bg-main)] transition-colors">
                                                <td className="p-4">
                                                    <div>
                                                        <p className="font-black truncate max-w-[120px]">{s.fullName}</p>
                                                        <p className="text-[10px] text-[var(--text-muted)]">ID: {s.loginId}</p>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-[10px] font-black uppercase text-[var(--text-muted)]">{s.groupId?.name || '---'}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-[10px] px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full border border-blue-500/20">{s.testId?.topic || s.chosenSubject || user?.subject || 'Boshqa'}</span>
                                                </td>
                                                <td className="p-4 text-center text-emerald-500">{s.correctCount || 0}</td>
                                                <td className="p-4 text-center text-rose-500">{s.wrongCount || 0}</td>
                                                <td className="p-4 text-center text-[var(--text-muted)] font-mono">{s.timeSpent || '00:00'}</td>
                                                <td className="p-4 text-right">
                                                    <span className="text-lg font-black text-indigo-500">{s.score}</span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => setViewingResultStudent(s)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"><Eye size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredStatsData.length === 0 && (
                                            <tr><td colSpan="8" className="p-12 text-center text-[var(--text-muted)] uppercase text-xs tracking-widest">Tanlangan vaqt oralig'ida natijalar yo'q</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'questions' && (
                    <div className="animate-in fade-in zoom-in duration-500 flex flex-col gap-10">
                        <header className="flex justify-between items-center bg-[var(--bg-card)] p-6 rounded-[32px] shadow-sm border border-[var(--border-main)] transition-colors">
                            <div>
                                <h2 className="text-3xl font-black text-[var(--text-main)] uppercase tracking-tighter">Test Yaratish (Builder)</h2>
                                <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mt-1">Mavzu yarating va savollar qo'shing</p>
                            </div>
                            <div className="flex items-center gap-4">
                                {/* Header buttons if needed */}
                            </div>
                        </header>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Add Question Form */}
                            <div className="bg-[var(--bg-card)] p-10 rounded-[48px] shadow-sm border border-[var(--border-main)] relative overflow-y-auto max-h-[calc(100vh-200px)] transition-colors">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                                <div className="space-y-3">
                                    <select
                                        className="w-full px-6 py-5 rounded-[28px] border-2 border-[var(--border-main)] bg-gradient-to-br from-[var(--bg-main)] to-[var(--bg-card)] font-bold text-base outline-none text-[var(--text-main)] cursor-pointer hover:border-indigo-500/30 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm appearance-none"
                                        value={selectedTestId}
                                        onChange={e => { setSelectedTestId(e.target.value); if (e.target.value) setTopicName(''); }}
                                    >
                                        <option value="">✨ Yangi Test Mavzusi</option>
                                        {activeTests.map(t => (
                                            <option key={t._id} value={t._id}>📚 {t.topic} ({t.count})</option>
                                        ))}
                                    </select>

                                    {!selectedTestId && (
                                        <input
                                            type="text"
                                            placeholder="Mavzu nomini kiriting..."
                                            className="w-full px-6 py-5 rounded-[28px] border-2 border-dashed border-indigo-400/30 bg-indigo-50/50 dark:bg-indigo-950/20 font-bold text-base outline-none text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                            value={topicName}
                                            onChange={e => setTopicName(e.target.value)}
                                        />
                                    )}
                                </div>

                                <div className="h-px bg-gradient-to-r from-transparent via-[var(--border-main)] to-transparent my-8"></div>

                                <form onSubmit={handleAddQuestionToTest} className="space-y-6 relative z-10">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[var(--text-muted)] ml-2 flex items-center gap-2">
                                            <MessageSquare size={14} />
                                            Savol matni
                                        </label>
                                        <textarea
                                            placeholder="Savolingizni kiriting..."
                                            required
                                            className="w-full px-6 py-5 rounded-[24px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-[var(--bg-card)] focus:border-indigo-500 transition-all font-medium text-[var(--text-main)] text-base min-h-[100px] resize-none"
                                            value={qData.questionText}
                                            onChange={e => setQData({ ...qData, questionText: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-[var(--text-muted)] ml-2 flex items-center gap-2">
                                            <List size={14} />
                                            Javob variantlari
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {qData.options.map((opt, idx) => (
                                                <div key={idx} className={`flex items-center gap-2 p-3 rounded-[20px] border-2 transition-all ${qData.correctOption === idx ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500' : 'bg-[var(--bg-main)] border-[var(--border-main)] hover:border-indigo-300/50'}`}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setQData({ ...qData, correctOption: idx })}
                                                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${qData.correctOption === idx ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-200 dark:bg-slate-700'}`}
                                                    >
                                                        {qData.correctOption === idx && <Check size={14} className="text-white font-bold" />}
                                                    </button>
                                                    <input
                                                        type="text"
                                                        placeholder={`${idx + 1}-variant`}
                                                        required
                                                        className="flex-1 bg-transparent border-none focus:ring-0 font-medium text-[var(--text-main)] text-sm placeholder:text-slate-400 outline-none"
                                                        value={opt}
                                                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-6">
                                        {editingId && (
                                            <button
                                                type="button"
                                                onClick={() => { setEditingId(null); setQData({ questionText: '', options: ['', '', '', ''], correctOption: 0 }); }}
                                                className="flex-1 px-6 py-4 bg-[var(--bg-main)] text-[var(--text-muted)] rounded-[20px] font-bold text-sm border-2 border-[var(--border-main)] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-950/20 transition-all"
                                            >
                                                Bekor qilish
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-[20px] font-bold text-sm shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            {editingId ? <><Edit3 size={16} /> O'zgartirish</> : <><Plus size={16} /> Qo'shish</>}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Questions List (Builder Preview) */}
                            <div className="flex flex-col h-full gap-4">
                                <div className="bg-[var(--bg-card)] rounded-[48px] shadow-sm border border-[var(--border-main)] flex flex-col overflow-hidden transition-colors flex-1">
                                    <div className="p-8 border-b border-[var(--border-main)] flex justify-between items-center bg-[var(--bg-main)] opacity-80">
                                        <div>
                                            <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter">Testdagi Savollar</h3>
                                            <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.2em] mt-1">Joriy Test: {topicName || 'Nomsiz'}</p>
                                        </div>
                                        <div className="px-4 py-2 bg-indigo-500/10 text-indigo-500 rounded-xl font-black text-xs">
                                            {builderQuestions.length} ta
                                        </div>
                                    </div>

                                    <div className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar">
                                        {builderQuestions.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center opacity-20 select-none text-[var(--text-main)]">
                                                <BookOpen size={64} />
                                                <p className="mt-4 font-black uppercase tracking-widest text-xs">Hali savollar qo'shilmadi</p>
                                            </div>
                                        ) : (
                                            builderQuestions.map((q, idx) => (
                                                <div key={idx} className={`p-6 bg-[var(--bg-main)] rounded-[32px] border transition-all group relative ${editingId === q._id ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-transparent hover:border-blue-500/20 hover:bg-[var(--bg-card)]'}`}>
                                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button onClick={() => handleEditBuilderQuestion(q)} className="p-2 bg-[var(--bg-card)] text-indigo-400 rounded-lg border border-[var(--border-main)] hover:text-indigo-600 hover:shadow-md transition-all active:scale-95"><Edit3 size={14} /></button>
                                                        <button onClick={() => handleDeleteBuilderQuestion(q._id)} className="p-2 bg-[var(--bg-card)] text-rose-400 rounded-lg border border-[var(--border-main)] hover:text-rose-600 hover:shadow-md transition-all active:scale-95"><Trash2 size={14} /></button>
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <div className="flex-shrink-0 w-8 h-8 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl flex items-center justify-center font-black text-xs text-[var(--text-muted)]">{idx + 1}</div>
                                                        <div className="space-y-3 w-full pr-10">
                                                            <p className="font-bold text-[var(--text-main)] leading-relaxed text-sm">{q.questionText}</p>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {q.options.map((opt, oIdx) => (
                                                                    <div key={oIdx} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border ${oIdx === q.correctOption ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-main)]'}`}>
                                                                        {oIdx === q.correctOption && <CheckCircle2 size={10} />}
                                                                        {opt}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveTest}
                                    disabled={builderQuestions.length === 0}
                                    className="w-full py-6 bg-emerald-500 disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-[32px] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    <Save size={20} />
                                    {selectedTestId ? `Testga Qo'shish (+${builderQuestions.length})` : `Testni Saqlash (${builderQuestions.length})`}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'topics' && (
                    <div className="animate-in fade-in zoom-in duration-500 flex flex-col gap-6">
                        <header className="flex justify-between items-center bg-[var(--bg-card)] p-6 rounded-[32px] shadow-sm border border-[var(--border-main)]">
                            <div>
                                <h2 className="text-3xl font-black text-[var(--text-main)] uppercase tracking-tighter">Test Mavzulari</h2>
                                <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mt-1">Yaratilgan testlar ro'yxati</p>
                            </div>
                        </header>

                        <div className="bg-[var(--bg-card)] rounded-[48px] border border-[var(--border-main)] overflow-hidden">
                            <div className="p-8 bg-[var(--bg-main)] border-b border-[var(--border-main)]">
                                <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter">Aktiv Testlar</h3>
                            </div>
                            <div className="p-6 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar">
                                {activeTests.map(t => (
                                    <div key={t._id} className="p-6 bg-[var(--bg-main)] rounded-[32px] border border-[var(--border-main)] flex justify-between items-center group hover:border-indigo-500/30 transition-all cursor-pointer" onClick={() => handleViewTest(t)}>
                                        <div>
                                            <p className="font-black text-sm text-[var(--text-main)] uppercase">{t.topic}</p>
                                            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mb-2">{t.count} ta savol • {new Date(t.createdAt).toLocaleDateString()}</p>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded inline-block">
                                                {t.participants?.length || 0} kishi ishlagan
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-1">Kod</p>
                                                <p className="text-3xl font-black text-indigo-500 tracking-tighter">{t.accessCode}</p>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleViewTest(t); }}
                                                className="p-3 rounded-full bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all group-hover:scale-110"
                                            >
                                                <Eye size={20} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteTest(t._id, e)}
                                                className="p-3 rounded-full bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all group-hover:scale-110"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {activeTests.length === 0 && <p className="text-center text-[var(--text-muted)] text-xs uppercase tracking-widest py-10">Testlar yo'q</p>}
                            </div>
                        </div>

                        {/* Test Details Modal */}
                        {viewingTest && (
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingTest(null)}>
                                <div className="bg-[var(--bg-card)] rounded-[32px] border border-[var(--border-main)] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                                    <div className="p-6 border-b border-[var(--border-main)] flex justify-between items-center bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                                        <div>
                                            <h3 className="text-2xl font-black text-[var(--text-main)] uppercase">{viewingTest.topic}</h3>
                                            <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest mt-1">{testQuestions.length} ta savol</p>
                                        </div>
                                        <button onClick={() => setViewingTest(null)} className="p-2 hover:bg-rose-500/10 rounded-full transition-all">
                                            <AlertCircle size={24} className="text-rose-500" />
                                        </button>
                                    </div>
                                    <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
                                        {testQuestions.map((q, idx) => (
                                            <div key={q._id} className="p-6 bg-[var(--bg-main)] rounded-[24px] border border-[var(--border-main)]">
                                                <p className="font-bold text-[var(--text-main)] mb-4 flex items-start gap-3">
                                                    <span className="bg-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm">{idx + 1}</span>
                                                    <span className="flex-1">{q.questionText}</span>
                                                </p>
                                                <div className="grid grid-cols-2 gap-2 ml-11">
                                                    {q.options.map((opt, i) => (
                                                        <div key={i} className={`p-3 rounded-[16px] text-sm flex items-center gap-2 ${q.correctOption === i ? 'bg-emerald-500/20 border-2 border-emerald-500 font-bold text-emerald-700 dark:text-emerald-400' : 'bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-muted)]'}`}>
                                                            {q.correctOption === i && <Check size={16} className="text-emerald-500" />}
                                                            {opt}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'groups' && (
                    <div className="animate-in fade-in zoom-in duration-500 flex flex-col gap-10">
                        <header className="flex justify-between items-center bg-[var(--bg-card)] p-6 rounded-[32px] shadow-sm border border-[var(--border-main)]">
                            <div><h2 className="text-3xl font-black text-[var(--text-main)] uppercase tracking-tighter">Guruhlar</h2><p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mt-1">Sinflarni Boshqarish</p></div>
                        </header>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            <div className="bg-[var(--bg-card)] p-10 rounded-[48px] shadow-sm border border-[var(--border-main)] h-fit">
                                <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter mb-6">Yangi Guruh</h3>
                                <form onSubmit={handleCreateGroup} className="space-y-4">
                                    <input type="text" required placeholder="Guruh nomi..." className="w-full px-6 py-4 rounded-[24px] border border-[var(--border-main)] bg-[var(--bg-main)] font-bold text-sm outline-none text-[var(--text-main)]" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                                    <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all">Yaratish</button>
                                </form>
                            </div>
                            <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-[48px] border border-[var(--border-main)] p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {groups.map(g => (
                                        <div key={g._id} className="p-6 bg-[var(--bg-main)] rounded-[32px] border border-[var(--border-main)] hover:shadow-lg transition-all group">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center"><Users size={20} /></div>
                                                    <div>
                                                        {editingGroup?._id === g._id ? (
                                                            <form onSubmit={handleUpdateGroup} className="flex items-center gap-2">
                                                                <input
                                                                    autoFocus
                                                                    className="px-2 py-1 bg-[var(--bg-main)] border border-blue-500 rounded-lg text-sm font-black text-[var(--text-main)] outline-none"
                                                                    value={editGroupName}
                                                                    onChange={e => setEditGroupName(e.target.value)}
                                                                />
                                                                <button type="submit" className="text-emerald-500 p-1 hover:bg-emerald-500/10 rounded-lg transition-all"><Check size={16} /></button>
                                                                <button type="button" onClick={() => setEditingGroup(null)} className="text-rose-500 p-1 hover:bg-rose-500/10 rounded-lg transition-all"><X size={16} /></button>
                                                            </form>
                                                        ) : (
                                                            <>
                                                                <p className="font-black text-[var(--text-main)] uppercase text-sm flex items-center gap-2">
                                                                    {g.name}
                                                                    <button
                                                                        onClick={() => { setEditingGroup(g); setEditGroupName(g.name); }}
                                                                        className="text-[var(--text-muted)] hover:text-blue-500 transition-colors"
                                                                    >
                                                                        <Edit3 size={12} />
                                                                    </button>
                                                                </p>
                                                                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase">{g.subject}</p>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <button onClick={() => handleDeleteGroup(g._id)} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"><Trash2 size={16} /></button>
                                            </div>

                                            {/* Test Assignment */}
                                            <div className="mt-4 pt-4 border-t border-[var(--border-main)] space-y-3">
                                                <div>
                                                    <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2 block">Ro'yxatdan Tanlash</label>
                                                    <select
                                                        className="w-full px-4 py-3 rounded-[16px] border border-[var(--border-main)] bg-[var(--bg-card)] text-xs font-bold outline-none text-[var(--text-main)] appearance-none"
                                                        value={g.assignedTest?._id || g.assignedTest || ''}
                                                        onChange={(e) => handleAssignTest(g._id, e.target.value)}
                                                    >
                                                        <option value="">Test tanlang...</option>
                                                        {activeTests.map(t => (
                                                            <option key={t._id} value={t._id}>{t.topic} ({t.count})</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="relative">
                                                    <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2 block">yoki Test ID Kiriting</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Test ID..."
                                                            className="flex-1 px-4 py-3 rounded-[16px] border border-[var(--border-main)] bg-[var(--bg-card)] text-xs font-bold outline-none text-[var(--text-main)]"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && e.target.value.trim()) {
                                                                    handleAssignTest(g._id, e.target.value.trim());
                                                                    e.target.value = '';
                                                                }
                                                            }}
                                                        />
                                                        <button
                                                            onClick={(e) => {
                                                                const input = e.target.previousElementSibling;
                                                                if (input.value.trim()) {
                                                                    handleAssignTest(g._id, input.value.trim());
                                                                    input.value = '';
                                                                }
                                                            }}
                                                            className="px-4 py-3 bg-indigo-500 text-white rounded-[16px] hover:bg-indigo-600 transition-all text-xs font-bold uppercase"
                                                        >
                                                            OK
                                                        </button>
                                                    </div>
                                                </div>

                                                {g.assignedTest && (
                                                    <p className="mt-2 text-[9px] text-emerald-500 font-bold uppercase flex items-center gap-1">
                                                        <CheckCircle2 size={12} /> Test biriktirilgan
                                                    </p>
                                                )}

                                                <button
                                                    onClick={() => handleViewGroup(g)}
                                                    className="w-full mt-4 py-3 bg-blue-500 text-white rounded-[16px] hover:bg-blue-600 transition-all text-xs font-bold uppercase flex items-center justify-center gap-2"
                                                >
                                                    <Eye size={14} /> Guruhni Ko'rish
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {groups.length === 0 && <p className="col-span-2 text-center text-[var(--text-muted)] text-xs uppercase tracking-widest py-10">Guruhlar yo'q</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'students' && (
                    <div className="animate-in fade-in zoom-in duration-500 flex flex-col gap-10">
                        <header className="flex justify-between items-center bg-[var(--bg-card)] p-6 rounded-[32px] shadow-sm border border-[var(--border-main)] transition-colors">
                            <div>
                                <h2 className="text-3xl font-black text-[var(--text-main)] uppercase tracking-tighter">O'quvchilar</h2>
                                <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mt-1">Nazorat va Natijalar</p>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Jami</p>
                                    <p className="text-xl font-black text-[var(--text-main)] tracking-tighter">{students.length}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Topshirgan</p>
                                    <p className="text-xl font-black text-emerald-600 tracking-tighter">
                                        {students.filter(s => s.status === 'checked').length}
                                    </p>
                                </div>
                                <div className="hidden md:block text-right">
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">O'rtacha</p>
                                    <p className="text-xl font-black text-blue-600 tracking-tighter">
                                        {students.filter(s => s.status === 'checked').length > 0
                                            ? (students.filter(s => s.status === 'checked').reduce((acc, s) => acc + s.score, 0) / students.filter(s => s.status === 'checked').length).toFixed(1)
                                            : 0}
                                    </p>
                                </div>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Add Student */}
                            <div className="lg:col-span-1 bg-[var(--bg-card)] p-10 rounded-[48px] shadow-sm border border-[var(--border-main)] h-fit">
                                <h3 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tighter mb-2">Yangi O'quvchi</h3>
                                <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mb-8">ID Generatsiya qilish</p>
                                <form onSubmit={handleAddStudent} className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] ml-2">To'liq ism</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Masalan: Ali Valiyev"
                                            className="w-full px-6 py-4 rounded-[24px] border border-[var(--border-main)] bg-[var(--bg-main)] font-bold text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 text-[var(--text-main)]"
                                            value={newStudentName}
                                            onChange={e => setNewStudentName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] ml-2">Guruh (Ixtiyoriy)</label>
                                        <div className="relative">
                                            <select
                                                className="w-full px-6 py-4 rounded-[24px] border border-[var(--border-main)] bg-[var(--bg-main)] font-bold text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 text-[var(--text-main)] appearance-none"
                                                value={selectedGroup || ''}
                                                onChange={e => setSelectedGroup(e.target.value || null)}
                                            >
                                                <option value="">Guruhlanmagan</option>
                                                {groups.map(g => (
                                                    <option key={g._id} value={g._id}>{g.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                                                <Users size={16} />
                                            </div>
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full py-4 bg-slate-800 dark:bg-indigo-600 text-white rounded-[20px] font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-600 hover:shadow-xl transition-all">
                                        Qo'shish & ID Olish
                                    </button>
                                </form>
                            </div>

                            {/* Student List */}
                            <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-[48px] shadow-sm border border-[var(--border-main)] overflow-hidden">
                                <div className="p-8 border-b border-[var(--border-main)] bg-[var(--bg-main)] opacity-80">
                                    <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter mb-4">Ro'yxat</h3>

                                    {/* Search and Filter */}
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        {/* Search Input */}
                                        <div className="flex-1 relative">
                                            <input
                                                type="text"
                                                placeholder="Ism yoki ID bo'yicha qidirish..."
                                                className="w-full px-4 py-3 pl-10 rounded-[20px] border border-[var(--border-main)] bg-[var(--bg-card)] font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-[var(--text-main)]"
                                                value={studentSearchQuery}
                                                onChange={(e) => setStudentSearchQuery(e.target.value)}
                                            />
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                                        </div>

                                        {/* Status Filter */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setStudentStatusFilter('all')}
                                                className={`px-4 py-2 rounded-[16px] text-xs font-bold uppercase transition-all ${studentStatusFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-main)]'}`}
                                            >
                                                Hammasi
                                            </button>
                                            <button
                                                onClick={() => setStudentStatusFilter('pending')}
                                                className={`px-4 py-2 rounded-[16px] text-xs font-bold uppercase transition-all ${studentStatusFilter === 'pending' ? 'bg-amber-500 text-white' : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-main)]'}`}
                                            >
                                                Kutilmoqda
                                            </button>
                                            <button
                                                onClick={() => setStudentStatusFilter('checked')}
                                                className={`px-4 py-2 rounded-[16px] text-xs font-bold uppercase transition-all ${studentStatusFilter === 'checked' ? 'bg-emerald-500 text-white' : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-main)]'}`}
                                            >
                                                Topshirgan
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">ID (Login)</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">F.I.SH</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Guruh</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Test</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] text-center">Togri</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] text-center">Xato</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] text-center">Vaqt</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Ball</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] text-right">Amallar</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm font-bold text-[var(--text-main)]">
                                            {students.length === 0 ? (
                                                <tr><td colSpan="5" className="p-8 text-center text-[var(--text-muted)] uppercase text-xs tracking-widest">O'quvchilar yo'q</td></tr>
                                            ) : (
                                                students
                                                    .filter(s => {
                                                        // Search filter
                                                        const matchesSearch = s.fullName.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                                                            s.loginId.includes(studentSearchQuery);

                                                        // Status filter
                                                        const matchesStatus = studentStatusFilter === 'all' || s.status === studentStatusFilter;

                                                        return matchesSearch && matchesStatus;
                                                    })
                                                    .map((s) => (
                                                        <tr key={s._id} className="border-b border-[var(--border-main)] last:border-0 hover:bg-[var(--bg-main)] transition-colors">
                                                            <td className="p-4 font-mono text-lg text-indigo-500 tracking-widest">{s.loginId}</td>
                                                            <td className="p-4 font-bold">{s.fullName}</td>
                                                            <td className="p-4 text-xs font-black uppercase text-[var(--text-muted)]">{s.groupId?.name || '---'}</td>
                                                            <td className="p-4">
                                                                <span className="text-[10px] px-2 py-1 bg-blue-500/10 text-blue-500 rounded-lg border border-blue-500/20 truncate inline-block">
                                                                    {activeTests.find(t => t._id === (s.testId?._id || s.testId))?.topic || s.testId?.topic || '---'}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-center font-black text-emerald-500">{s.status === 'checked' ? s.correctCount : '-'}</td>
                                                            <td className="p-4 text-center font-black text-rose-500">{s.status === 'checked' ? s.wrongCount : '-'}</td>
                                                            <td className="p-4 text-center font-mono text-xs text-[var(--text-muted)]">{s.status === 'checked' ? (s.timeSpent || '00:00') : '-'}</td>
                                                            <td className="p-4">
                                                                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${s.status === 'checked' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-amber-500/10 text-amber-500'}`}>
                                                                    {s.status === 'checked' ? `${s.score} ball` : 'Kutilmoqda'}
                                                                </span>
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    {s.status === 'checked' && (
                                                                        <>
                                                                            <button onClick={() => setViewingResultStudent(s)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all" title="Batafsil ko'rish"><Eye size={16} /></button>
                                                                            <button onClick={() => handleSendResult(s)} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all" title="Natijani yuborish"><Send size={16} /></button>
                                                                        </>
                                                                    )}
                                                                    <button onClick={() => handleDeleteStudent(s._id)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-all"><Trash2 size={16} /></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'profile' && (
                    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-[var(--bg-card)] rounded-[56px] border border-[var(--border-main)] shadow-sm overflow-hidden p-12 relative transition-colors shadow-2xl">
                            <div className="flex flex-col md:flex-row gap-16 items-start">
                                <div className="relative group">
                                    <div className="w-56 h-56 rounded-[56px] overflow-hidden bg-[var(--bg-main)] border-[6px] border-[var(--bg-card)] shadow-2xl group-hover:opacity-80 transition-all flex items-center justify-center">
                                        {profileData.image ? (
                                            <img src={profileData.image} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-emerald-500 flex items-center justify-center text-4xl font-black text-white">{profileData.name?.[0] || user?.name?.[0]}</div>
                                        )}
                                    </div>
                                    <label className="absolute -bottom-4 -right-4 p-5 bg-[#38BDF8] text-white rounded-[28px] shadow-2xl cursor-pointer hover:scale-110 hover:rotate-6 active:scale-95 transition-all flex items-center justify-center">
                                        <Camera size={28} /><input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                </div>

                                <div className="flex-1 space-y-10 w-full">
                                    <div>
                                        <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Ustoz / {user?.subject}</span>
                                        <h3 className="text-4xl font-black text-[var(--text-main)] tracking-tighter mt-4 leading-none">{profileData.name || user?.name}</h3>
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
                                                    <input type={showProfilePassword ? "text" : "password"} placeholder={t.optional_password} className="w-full px-8 py-5 rounded-[28px] border border-[var(--border-main)] bg-[var(--bg-main)] font-bold text-sm focus:bg-[var(--bg-card)] focus:ring-8 focus:ring-blue-500/5 transition-all pr-20 outline-none text-[var(--text-main)]" value={profileData.password} onChange={e => setProfileData({ ...profileData, password: e.target.value })} />
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

            {/* Group Detail Modal */}
            {viewingGroup && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setViewingGroup(null)}>
                    <div className="bg-[var(--bg-card)] rounded-[32px] max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-[var(--border-main)]" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="p-6 border-b border-[var(--border-main)] flex justify-between items-center bg-gradient-to-r from-blue-500/10 to-indigo-500/10">
                            <div>
                                <h2 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tighter">{viewingGroup.name}</h2>
                                <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest mt-1">{viewingGroup.subject}</p>
                            </div>
                            <button onClick={() => setViewingGroup(null)} className="p-2 hover:bg-[var(--bg-main)] rounded-xl transition-all">
                                <X size={24} className="text-[var(--text-muted)]" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tighter">{t.active_students} ({groupStudents.length})</h3>
                                    {viewingGroup.assignedTest && (
                                        <span className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-2xl text-xs font-bold border border-emerald-500/20">
                                            {t.test_topics}
                                        </span>
                                    )}
                                </div>

                                {groupStudents.length === 0 ? (
                                    <p className="text-center text-[var(--text-muted)] text-sm py-10">{t.no_questions}</p>
                                ) : (
                                    <div className="space-y-3">
                                        {groupStudents.map((student, idx) => (
                                            <div key={student._id} className="p-4 bg-[var(--bg-main)] rounded-[24px] border border-[var(--border-main)] hover:shadow-md transition-all">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white font-black">
                                                            {idx + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-[var(--text-main)] text-sm">{student.fullName}</p>
                                                            <p className="text-xs text-[var(--text-muted)] font-bold">{t.id_login}: {student.loginId}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {student.status === 'checked' ? (
                                                            <div className="text-right">
                                                                <p className="text-xl font-black text-emerald-500">{student.score || 0}</p>
                                                                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">
                                                                    {student.testId?.topic || 'Test'}
                                                                </p>
                                                                <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase">{t.score_ball}</p>
                                                            </div>
                                                        ) : (
                                                            <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-xl text-[10px] font-bold">
                                                                {student.status === 'pending' ? 'Kutilmoqda' : 'Jarayonda'}
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteStudent(student._id)}
                                                            className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-[var(--border-main)] bg-[var(--bg-main)]">
                            <button
                                onClick={() => setViewingGroup(null)}
                                className="w-full py-3 bg-[var(--bg-card)] text-[var(--text-main)] rounded-[20px] font-bold text-sm border border-[var(--border-main)] hover:bg-[var(--bg-main)] transition-all"
                            >
                                {t.cancel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Student Result Detailed Modal / Report */}
            {viewingResultStudent && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] flex items-center justify-center p-4 print:p-0" onClick={() => setViewingResultStudent(null)}>
                    <div className="bg-[var(--bg-card)] rounded-[40px] max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-[var(--border-main)] flex flex-col print:shadow-none print:border-0 print:rounded-0 print:max-h-none print:static" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
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

                        {/* Printable Content */}
                        <div className="flex-1 overflow-y-auto p-10 print:overflow-visible print:p-0">
                            <div id="printable-report" className="space-y-12">
                                {/* Report Header */}
                                <div className="text-center space-y-4">
                                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-slate-100 print:border-2">
                                        <img src="/logo.jpg" alt="Logo" className="w-14 h-14 object-contain" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-black text-[var(--text-main)] uppercase tracking-tighter">{t.report_title}</h1>
                                        <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.3em]">{t.official_report}</p>
                                    </div>
                                </div>

                                {/* Information Cards */}
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

                                {/* Summary Stats */}
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

                                {/* Question Breakdown (Detailed Table) */}
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
                                                        <td className="py-3 font-bold text-slate-900 pr-4">{q?.questionText || 'Savollarni ko\'rish cheklangan'}</td>
                                                        <td className="py-3 text-center"><span className={`px-3 py-1 rounded-lg font-black ${isCorrect ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{ans.selectedOption}</span></td>
                                                        <td className="py-3 text-right">{isCorrect ? <CheckCircle2 size={14} className="text-emerald-500 ml-auto" /> : <X size={14} className="text-rose-500 ml-auto" />}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Seal and Signature Area */}
                                <div className="pt-12 flex justify-between items-end border-t border-dashed border-[var(--border-main)]">
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">O'qituvchi imzosi:</p>
                                        <div className="w-48 h-px bg-slate-300"></div>
                                        <p className="font-bold text-sm text-[var(--text-main)]">{user?.name}</p>
                                    </div>
                                    <div className="relative w-32 h-32 border-4 border-blue-500/20 rounded-full flex items-center justify-center -rotate-12 border-double opacity-30">
                                        <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest text-center">CERTIFIED<br />RESULT<br />{new Date().getFullYear()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Notifications Modal */}
            {
                showTaskModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => { setShowTaskModal(false); setSelectedTask(null); }}>
                        <div className="bg-[var(--bg-card)] rounded-[40px] max-w-2xl w-full shadow-2xl border border-[var(--border-main)] p-8 animate-in slide-in-from-bottom-10 duration-300 flex flex-col h-[80vh]" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl"><MessageSquare size={24} /></div>
                                    <div><h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">Admin bilan muloqot</h3></div>
                                </div>
                                <button onClick={() => { setShowTaskModal(false); setSelectedTask(null); }} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
                            </div>

                            <div className="flex flex-1 overflow-hidden gap-6">
                                {/* Task List */}
                                {!selectedTask ? (
                                    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                                        {tasks.length > 0 ? tasks.map((task) => (
                                            <div
                                                key={task._id}
                                                onClick={() => {
                                                    setSelectedTask(task);
                                                    if (task.status === 'pending') handleUpdateTaskStatus(task._id, 'in_progress');
                                                }}
                                                className="p-5 bg-[var(--bg-main)] rounded-[24px] border border-[var(--border-main)] cursor-pointer hover:border-blue-500/50 hover:shadow-lg transition-all"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-black text-[var(--text-main)] text-sm uppercase">{task.title}</h4>
                                                    <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : task.status === 'in_progress' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                        {task.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-3">
                                                    {task.messages[task.messages.length - 1]?.text}
                                                </p>
                                                <span className="text-[9px] font-bold text-[var(--text-muted)]">
                                                    {new Date(task.updatedAt).toLocaleString()}
                                                </span>
                                            </div>
                                        )) : (
                                            <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] p-10 opacity-30">
                                                <MessageSquare size={48} className="mb-4" />
                                                <p className="font-black uppercase tracking-widest text-xs">Vazifalar yo'q</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Chat Interface */
                                    <div className="flex-1 flex flex-col h-full">
                                        <button onClick={() => setSelectedTask(null)} className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4 hover:underline">
                                            <ChevronLeft size={14} /> Orqaga
                                        </button>

                                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 custom-scrollbar">
                                            {selectedTask.messages.map((msg, i) => (
                                                <div key={i} className={`flex flex-col ${msg.sender === 'teacher' ? 'items-end' : 'items-start'}`}>
                                                    <div className="flex items-end gap-2 max-w-[85%]">
                                                        {msg.sender === 'admin' && (
                                                            <div className="w-8 h-8 min-w-[32px] rounded-full bg-blue-100 overflow-hidden border border-slate-200">
                                                                {adminInfo.image ? <img src={adminInfo.image} alt="Admin" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-blue-500">A</div>}
                                                            </div>
                                                        )}
                                                        <div className={`p-4 rounded-[20px] shadow-sm ${msg.sender === 'teacher' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-main)] rounded-tl-none'}`}>
                                                            <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-[8px] font-bold text-[var(--text-muted)] mt-1 px-2 uppercase tracking-tighter">
                                                        {msg.sender === 'teacher' ? 'Siz' : adminInfo.name} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <form onSubmit={handleSendChatMessage} className="flex gap-2 p-1 bg-[var(--bg-main)] rounded-[24px] border border-[var(--border-main)] focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                                            <input
                                                type="text"
                                                placeholder="Xabar yozing..."
                                                className="flex-1 bg-transparent border-none outline-none py-3 px-4 text-sm font-medium text-[var(--text-main)] placeholder:text-slate-400"
                                                value={chatMessage}
                                                onChange={(e) => setChatMessage(e.target.value)}
                                            />
                                            <button
                                                type="submit"
                                                className="p-3 bg-blue-600 text-white rounded-[20px] shadow-lg shadow-blue-500/20 hover:scale-[1.05] active:scale-95 transition-all"
                                            >
                                                <Send size={18} />
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Approvals Tab */}
            {activeTab === 'approvals' && (
                <div className="animate-in fade-in zoom-in duration-500 flex flex-col gap-6">
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[var(--bg-card)] p-6 rounded-[32px] shadow-sm border border-[var(--border-main)] gap-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-[var(--text-main)] hover:bg-black/5 rounded-xl transition-colors"><Menu size={24} /></button>
                            <div>
                                <h2 className="text-3xl font-black text-[var(--text-main)] uppercase tracking-tighter">Erta Kirish So'rovlari</h2>
                                <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mt-1">O'quvchilar ruxsat kutmoqda</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                            <Clock size={16} className="text-amber-500" />
                            <span className="text-sm font-black text-amber-500">{pendingApprovals.length} ta so'rov</span>
                        </div>
                    </header>

                    {pendingApprovals.length === 0 ? (
                        <div className="bg-[var(--bg-card)] p-12 rounded-[48px] border border-[var(--border-main)] text-center">
                            <Clock size={48} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-lg font-bold text-[var(--text-muted)]">Hozircha so'rovlar yo'q</p>
                            <p className="text-sm text-[var(--text-muted)] mt-2">O'quvchilar erta kirish uchun so'rov yuborganda bu yerda ko'rinadi</p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {pendingApprovals.map(student => (
                                <div key={student._id} className="bg-[var(--bg-card)] p-6 rounded-[32px] border border-[var(--border-main)] shadow-sm hover:shadow-lg transition-all" data-aos="fade-up">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-lg">
                                                    {student.fullName?.[0]?.toUpperCase() || 'O'}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-xl font-black text-[var(--text-main)]">{student.fullName}</h3>
                                                    <div className="flex flex-wrap items-center gap-3 mt-2">
                                                        <span className="text-xs font-bold text-[var(--text-muted)]">ID: {student.loginId}</span>
                                                        <span className="text-xs px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full border border-blue-500/20 font-bold">
                                                            {student.groupId?.name || 'Guruhsiz'}
                                                        </span>
                                                        <span className="text-xs px-3 py-1 bg-purple-500/10 text-purple-500 rounded-full border border-purple-500/20 font-bold">
                                                            {student.chosenSubject || user?.subject}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 p-4 bg-[var(--bg-main)] rounded-2xl border border-[var(--border-main)]">
                                                <div>
                                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">So'rov vaqti</p>
                                                    <p className="text-sm font-bold text-[var(--text-main)]">
                                                        {new Date(student.earlyAccessRequest?.requestedAt).toLocaleString('uz-UZ', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 min-w-[200px]">
                                            <button
                                                onClick={() => handleApproveEarlyAccess(student._id, true)}
                                                className="flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 text-white rounded-2xl font-bold text-sm hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                                            >
                                                <Check size={18} />
                                                Tasdiqlash
                                            </button>
                                            <button
                                                onClick={() => handleApproveEarlyAccess(student._id, false)}
                                                className="flex items-center justify-center gap-2 px-6 py-4 bg-rose-500 text-white rounded-2xl font-bold text-sm hover:bg-rose-600 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-rose-500/20"
                                            >
                                                <X size={18} />
                                                Rad etish
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeacherDashboard;
