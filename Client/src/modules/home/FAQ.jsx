import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, HelpCircle, ArrowLeft } from 'lucide-react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: "How do I book an appointment with my GN officer?",
      a: "Login to your account, go to the Appointments page, select a service, choose a date and time slot, and submit your request. You will receive a confirmation once approved."
    },
    {
      q: "What documents do I need for a Residence Certificate?",
      a: "You need your NIC, proof of address (utility bill), and your birth certificate. Additional documents may be required based on your specific case."
    },
    {
      q: "How do I check my appointment status?",
      a: "Go to the Appointments page in your dashboard. Your appointments will show as Pending, Confirmed, Completed, or Cancelled."
    },
    {
      q: "What are GN office hours?",
      a: "Grama Niladhari offices are open Monday to Friday, 9:00 AM - 4:00 PM. Closed on Saturdays, Sundays, and public holidays."
    },
    {
      q: "How do I contact my GN officer directly?",
      a: "Login to your account and go to the Contact GN page. You'll find your assigned GN officer's contact details there."
    },
    {
      q: "What should I do in an emergency?",
      a: "For emergencies, call Police (119), Ambulance (110), or Disaster Management (117). For GN-related emergencies, use the Emergency Hotline on your dashboard."
    },
    {
      q: "How do I download official forms?",
      a: "Go to the Forms page in your dashboard. You can either fill forms online and download as PDF, or download blank PDFs to fill manually."
    },
    {
      q: "Is my personal information safe?",
      a: "Yes! Smart Grama Sewa follows Sri Lanka's Personal Data Protection Act (2022). All your data is encrypted and secure."
    },
    {
      q: "How do I reset my password?",
      a: "On the login page, click 'Forgot Password'. Enter your registered email and follow the instructions sent to your inbox."
    },
    {
      q: "Can I book an appointment for someone else?",
      a: "Yes, you can book appointments for family members using your account. Just provide their details in the booking form."
    },
  ];

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#FFFBF0] py-12 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center gap-2 text-[#6A2301] font-semibold hover:underline mb-6">
          <ArrowLeft size={18} /> Back to Home
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <HelpCircle size={28} color="#6A2301" strokeWidth={2} />
          <h1 className="text-2xl md:text-3xl font-black text-[#3d2a00]">Frequently Asked Questions</h1>
        </div>
        <p className="text-sm text-[#7a5c00] mb-8">Find quick answers to common queries about Smart Grama Sewa.</p>

        {/* Search Box (Optional) */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search for questions..."
            className="w-full p-3 rounded-xl border border-gray-300 focus:border-[#F5C400] focus:outline-none bg-white"
          />
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-[#f0e8d0] overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex items-center justify-between p-4 text-left bg-transparent border-none cursor-pointer hover:bg-[#FFF8E1] transition-colors"
              >
                <span className="font-bold text-[#3d2a00] text-sm">{faq.q}</span>
                {openIndex === index ? (
                  <ChevronUp size={18} color="#6A2301" />
                ) : (
                  <ChevronDown size={18} color="#6A2301" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-[#5a3e00] leading-relaxed border-t border-[#f0e8d0] pt-3">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still have questions? */}
        <div className="mt-8 p-6 bg-[#6A2301] rounded-2xl text-white text-center">
          <p className="font-bold text-lg mb-2">Still have questions?</p>
          <p className="text-sm text-white/80 mb-4">Contact your GN officer or submit a support request.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/login" className="bg-[#FFCB05] text-black px-6 py-2 rounded-full font-bold text-sm hover:bg-yellow-400 transition-colors">
              Contact GN Officer
            </Link>
            <Link to="/" className="border border-white/30 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-white/10 transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;