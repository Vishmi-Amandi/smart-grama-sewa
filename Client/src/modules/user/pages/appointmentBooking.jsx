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
            {/* We'll add form fields here */}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AppointmentBooking;
