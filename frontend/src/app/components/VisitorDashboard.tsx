'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, LogIn, LogOut, CheckCircle } from 'lucide-react';
import api from '@/lib/axios';

const COLLEGES = [
  'College of Engineering',
  'College of Business',
  'College of Arts and Sciences',
  'College of Education',
  'College of Nursing',
  'College of Law',
  'Graduate School',
];

const REASONS = [
  { value: 'STUDY', label: 'Self Study' },
  { value: 'RESEARCH', label: 'Research' },
  { value: 'BORROW_BOOKS', label: 'Borrow Books' },
  { value: 'RETURN_BOOKS', label: 'Return Books' },
  { value: 'COMPUTER_USE', label: 'Computer Use' },
  { value: 'MEETING', label: 'Meeting/Discussion' },
  { value: 'OTHER', label: 'Other' },
];

export default function VisitorDashboard() {
  const [checkedIn, setCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    studentId: '',
    college: '',
    isEmployee: false,
    employeeType: '',
    reason: '',
    otherReason: '',
  });

  useEffect(() => {
    checkActiveVisit();
  }, []);

  const checkActiveVisit = async () => {
    try {
      const res = await api.get('/api/visits/active');
      if (res.data.active) setCheckedIn(true);
    } catch (error) {
      console.error('Error checking active visit:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/visits/checkin', formData);
      setCheckedIn(true);
    } catch (error) {
      alert('Failed to check in. Please try again.');
    }
  };

  const handleCheckOut = async () => {
    try {
      await api.post('/api/visits/checkout');
      setCheckedIn(false);
      setFormData(prev => ({ ...prev, reason: '', otherReason: '' }));
    } catch (error) {
      alert('Failed to check out. Please try again.');
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  if (checkedIn) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">You're Checked In!</h2>
        <p className="text-gray-600 mt-2">Welcome to NEU Library</p>
        <button onClick={handleCheckOut}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors">
          <LogOut className="w-4 h-4" />
          Check Out
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            Library Check-In
          </h2>
          <p className="text-blue-100 mt-1">Welcome to NEU Library! Please fill in your visit details.</p>
        </div>
        <form onSubmit={handleCheckIn} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" required value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student ID <span className="text-gray-400">(Optional)</span></label>
              <input type="text" value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">College/Department</label>
            <select required value={formData.college}
              onChange={(e) => setFormData({ ...formData, college: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
              <option value="">Select College</option>
              {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <input type="checkbox" id="isEmployee" checked={formData.isEmployee}
              onChange={(e) => setFormData({ ...formData, isEmployee: e.target.checked, employeeType: '' })}
              className="w-4 h-4 text-blue-600 rounded" />
            <label htmlFor="isEmployee" className="text-sm font-medium text-gray-700">I am a NEU Employee</label>
            {formData.isEmployee && (
              <select required value={formData.employeeType}
                onChange={(e) => setFormData({ ...formData, employeeType: e.target.value })}
                className="ml-auto border rounded-lg px-3 py-1 text-sm">
                <option value="">Select Type</option>
                <option value="TEACHER">Teacher</option>
                <option value="STAFF">Staff</option>
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit</label>
            <select required value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
              <option value="">Select Reason</option>
              {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          {formData.reason === 'OTHER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Please specify</label>
              <input type="text" required value={formData.otherReason}
                onChange={(e) => setFormData({ ...formData, otherReason: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
            </div>
          )}
          <button type="submit"
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            <LogIn className="w-4 h-4" />
            Check In to Library
          </button>
        </form>
      </div>
    </motion.div>
  );
}