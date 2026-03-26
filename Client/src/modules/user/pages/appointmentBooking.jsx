import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AppointmentBooking = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Mock time slots (will connect to real data later)
  const timeSlots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedDate) {
      setError('Please select a date');
      return;
    }
    if (!selectedTime) {
      setError('Please select a time slot');
      return;
    }
    if (!purpose.trim()) {
      setError('Please enter the purpose of appointment');
      return;
    }

    setLoading(true);

    // Simulate booking (will connect to Firebase tomorrow)
    await new Promise(resolve => setTimeout(resolve, 1000));

    setLoading(false);
    alert('Appointment booked successfully!');
    navigate('/appointments');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <img src="/logo.png" alt="Smart Grama Sewa" className="h-10 w-auto" />
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Book an Appointment</h1>

        <div className="bg-white rounded-xl shadow p-6">
          <form onSubmit={handleSubmit}>
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
                    {error}
                </div>
                )}

                {/* Date Selection */}
                <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date
                </label>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB347]"
                />
                </div>

                {/* Time Slot Selection */}
                <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Time
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {timeSlots.map((time) => (
                    <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`py-2 px-3 rounded-lg border transition ${
                        selectedTime === time
                            ? 'bg-[#FFB347] text-white border-[#FFB347]'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-[#FFB347]'
                        }`}
                    >
                        {time}
                    </button>
                    ))}
                </div>
                </div>

                {/* Purpose */}
                <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purpose of Appointment
                </label>
                <textarea
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB347]"
                    placeholder="e.g., Residence Certificate, Birth Certificate, Document Signing..."
                />
                </div>

                <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FFB347] hover:bg-[#E67E22] text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50"
                >
                {loading ? 'Booking...' : 'Book Appointment'}
                </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AppointmentBooking;
