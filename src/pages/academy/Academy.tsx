import React, { useState, useEffect } from 'react';
import { PlayCircle, BookOpen, GraduationCap, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Academy() {
  const { currentUser } = useAuth();
  const [activeCategory, setActiveCategory] = useState('All');
  const [courses, setCourses] = useState<any[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      try {
        const coursesSnap = await getDocs(query(collection(db, 'academyCourses')));
        const coursesData = coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCourses(coursesData);
        
        if (currentUser) {
          const progressDoc = await getDoc(doc(db, 'academyProgress', currentUser.uid));
          if (progressDoc.exists()) {
            setCompletedIds(progressDoc.data().completedCourseIds || []);
          }
        }
      } catch (error) {
        console.error('Error fetching academy data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [currentUser]);

  const toggleComplete = async (courseId: string) => {
    if (!currentUser) return;
    try {
      const isCompleted = completedIds.includes(courseId);
      const newCompleted = isCompleted 
        ? completedIds.filter(id => id !== courseId)
        : [...completedIds, courseId];
      
      await setDoc(doc(db, 'academyProgress', currentUser.uid), {
        userId: currentUser.uid,
        completedCourseIds: newCompleted,
        lastActivityAt: new Date().toISOString()
      }, { merge: true });
      
      setCompletedIds(newCompleted);
      toast.success(isCompleted ? 'Marked as incomplete' : 'Course completed!');
    } catch (err) {
      toast.error('Failed to update progress');
    }
  };

  const completedCount = completedIds.length;
  const totalCourses = courses.length;
  const progressPercent = totalCourses === 0 ? 0 : (completedCount / totalCourses) * 100;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24 md:pb-0 font-sans text-white md:p-8">
      <div className="p-4 md:p-0 max-w-7xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          
          <div className="relative z-10 space-y-4 max-w-xl">
            <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
              <GraduationCap size={24} />
            </div>
            <h1 className="text-3xl font-black uppercase text-white tracking-tight">WorkPlex Academy</h1>
            <p className="text-sm text-gray-400 font-medium leading-relaxed">
              Elevate your skills. Learn from top earners and industry experts to grow your network, create viral content, and maximize your earnings potential.
            </p>
          </div>

          <div className="relative z-10 w-full md:w-auto bg-[#1A1A1A] p-6 rounded-2xl border border-[#2A2A2A] text-center min-w-[250px]">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Your Learning Progress</p>
            <p className="text-3xl font-black text-white mb-2">{completedCount} <span className="text-sm text-gray-500">/ {totalCourses} Completed</span></p>
            <div className="w-full bg-[#111] h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-hide">
          {['All', 'Creator', 'Leadership', 'Social Media'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition shrink-0 ${activeCategory === cat ? 'bg-indigo-500 text-white' : 'bg-[#111111] border border-[#2A2A2A] text-gray-500 hover:text-gray-300'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.filter(c => activeCategory === 'All' || c.category === activeCategory).map((course, idx) => {
              const isCompleted = completedIds.includes(course.id);
              return (
              <div key={course.id || idx} className="bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden group cursor-pointer hover:border-indigo-500/50 transition">
                <div className="h-32 bg-[#1A1A1A] relative flex items-center justify-center border-b border-[#2A2A2A]">
                  {course.type === 'Video' ? <PlayCircle size={40} className="text-gray-600 group-hover:text-indigo-500 transition" /> : <BookOpen size={40} className="text-gray-600 group-hover:text-indigo-500 transition" />}
                  <div className="absolute bottom-2 right-2 bg-[#0A0A0A]/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-black uppercase text-gray-400 flex items-center gap-1">
                    <Clock size={12} /> {course.duration}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-gray-800 text-gray-300 px-2 py-0.5 rounded">{course.category}</span>
                    {isCompleted && <CheckCircle size={16} className="text-emerald-500" />}
                  </div>
                  <h3 className="text-sm font-bold text-white mb-4">{course.title}</h3>
                  
                  <button 
                    onClick={() => toggleComplete(course.id)}
                    className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition flex justify-center items-center gap-2 ${isCompleted ? 'bg-[#1A1A1A] text-gray-500 border border-[#2A2A2A]' : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.2)]'}`}>
                    {isCompleted ? 'Review Material' : 'Start Learning'} <ArrowRight size={14} />
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
