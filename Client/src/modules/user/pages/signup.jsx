import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../firebase';

// Step Progress Indicator
const StepIndicator = ({ current }) => {
  const steps = ['About You', 'Contact Details', 'Password'];

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '0', marginBottom: '32px' }}>
      {steps.map((label, i) => {
        const index    = i + 1;
        const isDone   = current > index;
        const isActive = current === index;

        return (
          <React.Fragment key={index}>
            {/* Step dot*/}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '90px' }}>
              {/* Circle */}
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                backgroundColor: '#1a1a1a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: isActive ? '3px solid #1a1a1a' : '3px solid #1a1a1a',
                boxSizing: 'border-box',
              }}>
                {isDone ? (
                  /* Checkmark */
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : isActive ? (
                  /* Active ring */
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: 'white' }} />
                ) : (
                  /* Future dot */
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#555' }} />
                )}
              </div>
              {/* Label */}
              <span style={{ fontSize: '12px', fontWeight: 500, color: '#444', marginTop: '6px', textAlign: 'center' }}>
                {label}
              </span>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div style={{
                height: '2px', flex: 1, backgroundColor: '#1a1a1a',
                marginTop: '17px',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Shared input style 
const inp = {
    fontFamily: 'Seoge',
    width: '100%',
    padding: '13px 16px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
    border: '1.5px solid #d4c9a8',
    borderRadius: '10px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
};

const labelStyle = {
    fontFamily: 'Seoge',
    display: 'block',
    fontSize: '13px',
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: '7px',
};

// Dark brown pill button
const DarkBtn = ({ onClick, children, type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    style={{
      backgroundColor: '#3d2000',
      color: '#ffffff',
      border: 'none',
      borderRadius: '999px',
      padding: '13px 28px',
      fontSize: '14px',
      fontWeight: 700,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'background-color 0.15s',
    }}
    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#5a3010')}
    onMouseOut={(e)  => (e.currentTarget.style.backgroundColor = '#3d2000')}
  >
    {children}
  </button>
);

// Yellow pill button
const YellowBtn = ({ onClick, children, disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    style={{
      backgroundColor: disabled ? '#e0c060' : '#F5C400',
      color: '#3d2000',
      border: 'none',
      borderRadius: '999px',
      padding: '13px 28px',
      fontSize: '14px',
      fontWeight: 700,
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'background-color 0.15s',
    }}
    onMouseOver={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = '#d4a800'; }}
    onMouseOut={(e)  => { if (!disabled) e.currentTarget.style.backgroundColor = disabled ? '#e0c060' : '#F5C400'; }}
  >
    {children}
  </button>
);

// Privacy note
const PrivacyNote = () => (
  <div style={{
    backgroundColor: '#fdf8e1',
    border: '1px solid #e8d87a',
    borderRadius: '10px',
    padding: '12px 18px',
    marginTop: '20px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#5a4a10',
    textAlign: 'center',
  }}>
    We take your privacy seriously. Your data is encrypted and used only for official verification purposes.
  </div>
);

const EyeIcon = ({ open }) => open ? (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

// STEP 1 — About You
const Step1 = ({ data, onChange, onNext }) => {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!data.fullName.trim())  e.fullName = 'Full name is required.';
    if (!data.nic.trim())       e.nic      = 'NIC number is required.';
    else if (!/^(\d{9}[VvXx]|\d{12})$/.test(data.nic.trim()))
                                e.nic      = 'Enter a valid NIC (9 digits+V or 12 digits).';
    if (!data.dob)              e.dob      = 'Date of birth is required.';
    if (!data.address.trim())   e.address  = 'Home address is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div>
      <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#1a1a1a', marginBottom: '22px' }}>
        Personal Details
      </h2>

      {/* Full Name */}
      <div style={{ marginBottom: '18px' }}>
        <label style={labelStyle}>Your Full Name</label>
        <input
          type="text"
          value={data.fullName}
          onChange={(e) => onChange('fullName', e.target.value)}
          placeholder="Ruwan Sanjeewa Perera"
          style={{ ...inp, borderColor: errors.fullName ? '#e05050' : '#d4c9a8' }}
          onFocus={(e) => (e.target.style.borderColor = '#B46A02')}
          onBlur={(e)  => (e.target.style.borderColor = errors.fullName ? '#e05050' : '#d4c9a8')}
        />
        {errors.fullName && <p style={{ color: '#e05050', fontSize: '12px', marginTop: '4px' }}>{errors.fullName}</p>}
      </div>

      {/* NIC & DOB */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
        <div>
          <label style={labelStyle}>NIC Number</label>
          <input
            type="text"
            value={data.nic}
            onChange={(e) => onChange('nic', e.target.value)}
            placeholder="12 digits or 9 digits+V"
            style={{ ...inp, borderColor: errors.nic ? '#e05050' : '#d4c9a8' }}
            onFocus={(e) => (e.target.style.borderColor = '#B46A02')}
            onBlur={(e)  => (e.target.style.borderColor = errors.nic ? '#e05050' : '#d4c9a8')}
          />
          {errors.nic && <p style={{ color: '#e05050', fontSize: '12px', marginTop: '4px' }}>{errors.nic}</p>}
        </div>
        <div>
          <label style={labelStyle}>Date of Birth</label>
          <input
            type="date"
            value={data.dob}
            onChange={(e) => onChange('dob', e.target.value)}
            style={{ ...inp, borderColor: errors.dob ? '#e05050' : '#d4c9a8', color: data.dob ? '#1a1a1a' : '#999' }}
            onFocus={(e) => (e.target.style.borderColor = '#B46A02')}
            onBlur={(e)  => (e.target.style.borderColor = errors.dob ? '#e05050' : '#d4c9a8')}
          />
          {errors.dob && <p style={{ color: '#e05050', fontSize: '12px', marginTop: '4px' }}>{errors.dob}</p>}
        </div>
      </div>

      {/* Address & Continue */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', marginBottom: '4px' }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Your Home Address</label>
          <input
            type="text"
            value={data.address}
            onChange={(e) => onChange('address', e.target.value)}
            placeholder=""
            style={{ ...inp, borderColor: errors.address ? '#e05050' : '#d4c9a8' }}
            onFocus={(e) => (e.target.style.borderColor = '#B46A02')}
            onBlur={(e)  => (e.target.style.borderColor = errors.address ? '#e05050' : '#d4c9a8')}
          />
          {errors.address && <p style={{ color: '#e05050', fontSize: '12px', marginTop: '4px' }}>{errors.address}</p>}
        </div>
        <div style={{ flexShrink: 0, paddingBottom: errors.address ? '22px' : '0' }}>
          <DarkBtn onClick={() => { if (validate()) onNext(); }}>
            Continue →
          </DarkBtn>
        </div>
      </div>

      <PrivacyNote />
    </div>
  );
};

// STEP 2 — Contact Details 

const DISTRICT_DS_MAP = {
  'Colombo': [
    'Colombo', 'Dehiwala', 'Homagama', 'Kaduwela', 'Kesbewa',
    'Kolonnawa', 'Kotte', 'Maharagama', 'Moratuwa', 'Padukka',
    'Seethawaka', 'Thimbirigasyaya',
  ],
  'Gampaha': [
    'Attanagalla', 'Biyagama', 'Divulapitiya', 'Dompe', 'Gampaha',
    'Ja-Ela', 'Katana', 'Kelaniya', 'Mahara', 'Minuwangoda',
    'Mirigama', 'Negombo', 'Wattala',
  ],
  'Kalutara': [
    'Agalawatta', 'Bandaragama', 'Beruwala', 'Bulathsinhala',
    'Dodangoda', 'Horana', 'Ingiriya', 'Kalutara', 'Madurawela',
    'Mathugama', 'Millaniya', 'Palindanuwara', 'Panadura',
    'Walallawita',
  ],
  'Kandy': [
    'Akurana', 'Delthota', 'Doluwa', 'Ganga Ihala Korale',
    'Harispattuwa', 'Hatharaliyadda', 'Kandy', 'Kundasale',
    'Medadumbara', 'Minipe', 'Panvila', 'Pasbage Korale',
    'Pathadumbara', 'Pathahewaheta', 'Poojapitiya', 'Thumpane',
    'Udadumbara', 'Udapalatha', 'Ududumbara',
  ],
  'Matale': [
    'Ambanganga Korale', 'Dambulla', 'Galewela', 'Laggala-Pallegama',
    'Matale', 'Naula', 'Pallepola', 'Rattota', 'Ukuwela', 'Wilgamuwa',
    'Yatawatta',
  ],
  'Nuwara Eliya': [
    'Ambagamuwa', 'Hanguranketha', 'Kotmale', 'Nuwara Eliya',
    'Walapane',
  ],
  'Galle': [
    'Akmeemana', 'Ambalangoda', 'Balapitiya', 'Baddegama',
    'Benthota', 'Bope-Poddala', 'Elpitiya', 'Galle',
    'Gonapinuwala', 'Hikkaduwa', 'Imaduwa', 'Karandeniya',
    'Nagoda', 'Neluwa', 'Niyagama', 'Poddala', 'Welivitiya-Divithura',
    'West Hapitigama',
  ],
  'Matara': [
    'Akuressa', 'Athuraliya', 'Devinuwara', 'Dickwella', 'Hakmana',
    'Kamburupitiya', 'Kirinda Puhulwella', 'Kotapola', 'Malimbada',
    'Matara', 'Mulatiyana', 'Pasgoda', 'Pitabeddara', 'Thihagoda',
    'Weligama', 'Welipitiya',
  ],
  'Hambantota': [
    'Ambalantota', 'Angunakolapelessa', 'Beliatta', 'Hambantota',
    'Katuwana', 'Lunugamvehera', 'Okewela', 'Sooriyawewa',
    'Tangalle', 'Thissamaharama', 'Weeraketiya', 'Walasmulla',
  ],
  'Jaffna': [
    'Delft', 'Island North', 'Island South', 'Jaffna', 'Karainagar',
    'Nallur', 'Thenmaradchi', 'Vadamaradchi East', 'Vadamaradchi North',
    'Vadamaradchi South-West', 'Valikamam East', 'Valikamam North',
    'Valikamam South', 'Valikamam South-West', 'Valikamam West',
  ],
  'Kilinochchi': [
    'Kandawalai', 'Karachchi', 'Pachchilaipalli', 'Poonakary',
  ],
  'Mannar': [
    'Madhu', 'Mannar', 'Musalai', 'Nanaddan', 'Nanattan',
  ],
  'Mullaitivu': [
    'Maritimepattu', 'Oddusuddan', 'Puthukudiyiruppu',
    'Thunukkai', 'Welioya',
  ],
  'Vavuniya': [
    'Vavuniya', 'Vavuniya North', 'Vavuniya South', 'Vengalacheddikulam',
  ],
  'Trincomalee': [
    'Kantalai', 'Kinniya', 'Kuchchaveli', 'Morawewa',
    'Muttur', 'Padavi Sripura', 'Seruwila', 'Thambalagamuwa',
    'Trincomalee', 'Verugal',
  ],
  'Batticaloa': [
    'Eravur Pattu', 'Eravur Town', 'Kattankudy', 'Koralai Pattu',
    'Koralai Pattu Central', 'Koralai Pattu North', 'Koralai Pattu South',
    'Koralai Pattu West', 'Manmunai North', 'Manmunai Pattu',
    'Manmunai South and Eruvil Pattu', 'Manmunai West',
    'Porativu Pattu',
  ],
  'Ampara': [
    'Addalaichenai', 'Akkaraipattu', 'Ampara', 'Damana', 'Dehiattakandiya',
    'Irakkamam', 'Kalmunai', 'Kalmunai Muslim', 'Karaitivu', 'Lahugala',
    'Mahaoya', 'Navithanveli', 'Nintavur', 'Padiyathalawa',
    'Pothuvil', 'Samanthurai', 'Thirukovil', 'Uhana',
  ],
  'Kurunegala': [
    'Alawwa', 'Ambanpola', 'Bamunakotuwa', 'Bingiriya', 'Dodangaslanda',
    'Ehetuwewa', 'Galgamuwa', 'Ganewatta', 'Giribawa', 'Ibbagamuwa',
    'Katugampola', 'Kobeigane', 'Kotavehera', 'Kuliyapitiya East',
    'Kuliyapitiya West', 'Kurunegala', 'Mahawa', 'Mallawapitiya',
    'Maspotha', 'Mawathagama', 'Narammala', 'Nikaweratiya',
    'Panduwasnuwara', 'Pannala', 'Polgahawela', 'Polpithigama',
    'Rasnayakapura', 'Rideegama', 'Udubaddawa', 'Wariyapola',
    'Weerambugedara',
  ],
  'Puttalam': [
    'Anamaduwa', 'Arachchikattuwa', 'Chilaw', 'Dankotuwa', 'Kalpitiya',
    'Karuwalagaswewa', 'Mahakumbukkadawala', 'Mahawewa', 'Mundel',
    'Nattandiya', 'Nawagattegama', 'Pallama', 'Puttalam',
    'Vanathavilluwa', 'Wennappuwa',
  ],
  'Anuradhapura': [
    'Dimbulagala', 'Eppawala', 'Galnewa', 'Galenbindunuwewa',
    'Horowupotana', 'Ipalogama', 'Kahatagasdigiliya', 'Kebithigollewa',
    'Kekirawa', 'Mahavilachchiya', 'Mahiyanganaya', 'Medawachchiya',
    'Mihintale', 'Nachchaduwa', 'Nochchiyagama', 'Nuwaragam Palatha Central',
    'Nuwaragam Palatha East', 'Padaviya', 'Palagala', 'Rajanganaya',
    'Rambewa', 'Thalawa', 'Thirappane', 'Thambuththegama',
  ],
  'Polonnaruwa': [
    'Dimbulagala', 'Elahera', 'Hingurakgoda', 'Lankapura',
    'Medirigiriya', 'Polonnaruwa', 'Thamankaduwa', 'Welikanda',
  ],
  'Badulla': [
    'Badulla', 'Bandarawela', 'Ella', 'Hali-Ela', 'Haputale',
    'Kandaketiya', 'Lunugala', 'Mahiyanganaya', 'Meegahakivula',
    'Passara', 'Ridimaliyadda', 'Soranathota', 'Uva-Paranagama',
    'Welimada',
  ],
  'Moneragala': [
    'Bibile', 'Buttala', 'Katharagama', 'Madulla', 'Medagama',
    'Moneragala', 'Siyambalanduwa', 'Thanamalvila', 'Wellawaya',
  ],
  'Ratnapura': [
    'Ayagama', 'Balangoda', 'Colombo', 'Eheliyagoda', 'Elapatha',
    'Embilipitiya', 'Godakawela', 'Imbulpe', 'Kahawatta', 'Kalawana',
    'Kiriella', 'Kolonna', 'Kuruvita', 'Nivithigala', 'Opanayaka',
    'Pelmadulla', 'Ratnapura', 'Weligepola',
  ],
  'Kegalle': [
    'Aranayaka', 'Bulathkohupitiya', 'Deraniyagala', 'Dehiovita',
    'Galigamuwa', 'Kegalle', 'Mawanella', 'Rambukkana', 'Ruwanwella',
    'Warakapola', 'Yatiyanthota',
  ],
};

const selectStyle = {
  ...inp,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24'%3E%3Cpath fill='%23666' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '36px',
  cursor: 'pointer',
};

const Step2 = ({ data, onChange, onNext, onBack }) => {
  const [errors, setErrors] = useState({});

  // Derive DS divisions from selected district
  const dsDivisions = data.district ? (DISTRICT_DS_MAP[data.district] || []) : [];

  // When district changes → reset dsDiv and gnDiv
  const handleDistrictChange = (val) => {
    onChange('district', val);
    onChange('dsDiv', '');
    onChange('gnDiv', '');
  };

  // When DS div changes → reset gnDiv (GN data not included — placeholder)
  const handleDsDivChange = (val) => {
    onChange('dsDiv', val);
    onChange('gnDiv', '');
  };

  const validate = () => {
    const e = {};
    if (!data.email.trim())  e.email    = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
                             e.email    = 'Enter a valid email.';
    if (!data.mobile.trim()) e.mobile   = 'Mobile number is required.';
    if (!data.district)      e.district = 'Please select your district.';
    if (!data.dsDiv)         e.dsDiv    = 'Please select your DS Division.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div>
      <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#1a1a1a', marginBottom: '22px' }}>
        Contact Details
      </h2>

      {/* Email & Mobile */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
        <div>
          <label style={labelStyle}>Email address</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onChange('email', e.target.value)}
            style={{ ...inp, borderColor: errors.email ? '#e05050' : '#d4c9a8' }}
            onFocus={(e) => (e.target.style.borderColor = '#B46A02')}
            onBlur={(e)  => (e.target.style.borderColor = errors.email ? '#e05050' : '#d4c9a8')}
          />
          {errors.email && <p style={{ color: '#e05050', fontSize: '12px', marginTop: '4px' }}>{errors.email}</p>}
        </div>
        <div>
          <label style={labelStyle}>Mobile Number</label>
          <input
            type="tel"
            value={data.mobile}
            onChange={(e) => onChange('mobile', e.target.value)}
            placeholder=""
            style={{ ...inp, borderColor: errors.mobile ? '#e05050' : '#d4c9a8' }}
            onFocus={(e) => (e.target.style.borderColor = '#B46A02')}
            onBlur={(e)  => (e.target.style.borderColor = errors.mobile ? '#e05050' : '#d4c9a8')}
          />
          {errors.mobile && <p style={{ color: '#e05050', fontSize: '12px', marginTop: '4px' }}>{errors.mobile}</p>}
        </div>
      </div>

      {/* District, DS Division & GN Division */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '28px' }}>

        {/* 1. District */}
        <div>
          <label style={labelStyle}>Your District</label>
          <select
            value={data.district}
            onChange={(e) => handleDistrictChange(e.target.value)}
            style={{ ...selectStyle, borderColor: errors.district ? '#e05050' : '#d4c9a8' }}
          >
            <option value="">Select district…</option>
            {Object.keys(DISTRICT_DS_MAP).sort().map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {errors.district && <p style={{ color: '#e05050', fontSize: '12px', marginTop: '4px' }}>{errors.district}</p>}
        </div>

        {/* 2. DS Division — populated from district */}
        <div>
          <label style={labelStyle}>Your Divisional Secretariat Division</label>
          <select
            value={data.dsDiv}
            onChange={(e) => handleDsDivChange(e.target.value)}
            disabled={!data.district}
            style={{
              ...selectStyle,
              borderColor: errors.dsDiv ? '#e05050' : '#d4c9a8',
              opacity: data.district ? 1 : 0.5,
              cursor: data.district ? 'pointer' : 'not-allowed',
            }}
          >
            <option value="">
              {data.district ? 'Select DS Division…' : 'Select district first'}
            </option>
            {dsDivisions.map((ds) => (
              <option key={ds} value={ds}>{ds}</option>
            ))}
          </select>
          {errors.dsDiv && <p style={{ color: '#e05050', fontSize: '12px', marginTop: '4px' }}>{errors.dsDiv}</p>}
        </div>

        {/* 3. GN Division — enabled after DS is picked */}
        <div>
          <label style={labelStyle}>Your Grama Niladhari Division</label>
          <select
            value={data.gnDiv}
            onChange={(e) => onChange('gnDiv', e.target.value)}
            disabled={!data.dsDiv}
            style={{
              ...selectStyle,
              opacity: data.dsDiv ? 1 : 0.5,
              cursor: data.dsDiv ? 'pointer' : 'not-allowed',
            }}
          >
            <option value="">
              {data.dsDiv ? 'Select GN Division…' : 'Select DS Division first'}
            </option>
            {/* GN divisions would be fetched from API based on dsDiv */}
            <option value="GN Division 01">GN Division 01</option>
            <option value="GN Division 02">GN Division 02</option>
            <option value="GN Division 03">GN Division 03</option>
            <option value="GN Division 04">GN Division 04</option>
            <option value="GN Division 05">GN Division 05</option>
          </select>
        </div>

      </div>

      {/* Back & Continue */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <DarkBtn onClick={onBack}>← Back</DarkBtn>
        <DarkBtn onClick={() => { if (validate()) onNext(); }}>Continue →</DarkBtn>
      </div>

      <PrivacyNote />
    </div>
  );
};

// STEP 3 — Password 
const Step3 = ({ data, onChange, onSubmit, onBack }) => {
  const [showPw,   setShowPw]   = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);

  const pwStrength = (pw) => {
    let s = 0;
    if (pw.length >= 8)          s++;
    if (/[A-Z]/.test(pw))        s++;
    if (/[0-9]/.test(pw))        s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const strength       = pwStrength(data.password);
  const strengthColors = ['#e05050','#e05050','#f0a030','#3090e0','#30c060'];
  const strengthLabels = ['','Weak','Fair','Good','Strong'];

  const validate = () => {
    const e = {};
    if (!data.username.trim())  e.username = 'Username is required.';
    if (!data.password)         e.password = 'Password is required.';
    else if (data.password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (!data.confirm)          e.confirm  = 'Please confirm your password.';
    else if (data.password !== data.confirm) e.confirm = "Passwords don't match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    
    try {

        console.log('🔵 1. Starting account creation...');
        console.log('Email:', data.email);
        
        const credential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password,
      );
    
    try {
        await updateProfile(credential.user, {
          displayName: data.username,
        });
        console.log('✅ 3. updateProfile SUCCESS');
      } catch (e) {
        console.warn('⚠️ 3. updateProfile FAILED:', e.message);
      }

    try {
        await setDoc(doc(db, 'users', credential.user.uid), {
          uid:       credential.user.uid,
          username:  data.username,
          fullName:  data.fullName,
          nic:       data.nic,
          dob:       data.dob,
          address:   data.address,
          email:     data.email,
          mobile:    data.mobile,
          district:  data.district,
          dsDiv:     data.dsDiv,
          gnDiv:     data.gnDiv,
          role:      'citizen',
          createdAt: serverTimestamp(),
        });
        console.log('✅ 4. Firestore setDoc SUCCESS');
      } catch (e) {
        console.warn('⚠️ 4. Firestore setDoc FAILED:', e.message);
    }

    console.log('🟢 5. Calling onSubmit — going to success screen...');
    onSubmit();
 
    } catch (err) {

        console.error('❌ Firebase Auth FAILED:', err.code, err.message);
    const friendlyError = {
      'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
      'auth/invalid-email':        'The email address is not valid.',
      'auth/weak-password':        'Password is too weak. Use at least 8 characters.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
    }[err.code] || `Something went wrong: ${err.message}`;
    setErrors((prev) => ({ ...prev, firebase: friendlyError }));
  } finally {
    setLoading(false);
  }
};

  return (
    <div>
      <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#1a1a1a', marginBottom: '22px' }}>
        Secure Your Account
      </h2>

    {errors.firebase && (
        <div style={{
          backgroundColor: '#fff0f0',
          border: '1.5px solid #f0a0a0',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '18px',
          fontSize: '13px',
          fontWeight: 600,
          color: '#c00',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
        }}>
          <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠</span>
          {errors.firebase}
        </div>
      )}

      {/* Username */}
      <div style={{ marginBottom: '18px' }}>
        <label style={labelStyle}>User name</label>
        <input
          type="text"
          value={data.username}
          onChange={(e) => onChange('username', e.target.value)}
          placeholder="e.g. ruwan_perera92"
          style={{ ...inp, maxWidth: '320px', borderColor: errors.username ? '#e05050' : '#d4c9a8' }}
          onFocus={(e) => (e.target.style.borderColor = '#B46A02')}
          onBlur={(e)  => (e.target.style.borderColor = errors.username ? '#e05050' : '#d4c9a8')}
        />
        {errors.username && <p style={{ color: '#e05050', fontSize: '12px', marginTop: '4px' }}>{errors.username}</p>}
      </div>

      {/* Password & Confirm */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '8px' }}>
        <div>
          <label style={labelStyle}>Create a strong password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPw ? 'text' : 'password'}
              value={data.password}
              onChange={(e) => onChange('password', e.target.value)}
              placeholder="Min 8. characters"
              style={{ ...inp, paddingRight: '44px', borderColor: errors.password ? '#e05050' : '#d4c9a8' }}
              onFocus={(e) => (e.target.style.borderColor = '#B46A02')}
              onBlur={(e)  => (e.target.style.borderColor = errors.password ? '#e05050' : '#d4c9a8')}
            />
            <button type="button" onClick={() => setShowPw((v) => !v)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
              <EyeIcon open={showPw} />
            </button>
          </div>
          {/* Strength bar */}
          {data.password && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                {[1,2,3,4].map((i) => (
                  <div key={i} style={{
                    height: '4px', flex: 1, borderRadius: '2px',
                    backgroundColor: i <= strength ? strengthColors[strength] : '#ddd',
                    transition: 'background-color 0.2s',
                  }} />
                ))}
              </div>
              <span style={{ fontSize: '11px', color: strengthColors[strength], fontWeight: 600 }}>
                {strengthLabels[strength]}
              </span>
            </div>
          )}
          {errors.password && <p style={{ color: '#e05050', fontSize: '12px', marginTop: '4px' }}>{errors.password}</p>}
        </div>
        <div>
          <label style={labelStyle}>Confirm password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showConf ? 'text' : 'password'}
              value={data.confirm}
              onChange={(e) => onChange('confirm', e.target.value)}
              placeholder=""
              style={{ ...inp, paddingRight: '44px', borderColor: errors.confirm ? '#e05050' : '#d4c9a8' }}
              onFocus={(e) => (e.target.style.borderColor = '#B46A02')}
              onBlur={(e)  => (e.target.style.borderColor = errors.confirm ? '#e05050' : '#d4c9a8')}
            />
            <button type="button" onClick={() => setShowConf((v) => !v)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
              <EyeIcon open={showConf} />
            </button>
          </div>
          {data.confirm && data.confirm === data.password && (
            <p style={{ color: '#30a050', fontSize: '12px', marginTop: '4px', fontWeight: 600 }}>✓ Passwords match</p>
          )}
          {errors.confirm && <p style={{ color: '#e05050', fontSize: '12px', marginTop: '4px' }}>{errors.confirm}</p>}
        </div>
      </div>

      <p style={{ fontSize: '12px', color: '#666', marginBottom: '24px' }}>
        At least 8 characters, including numbers and symbols for better security.
      </p>

      {/* Back & Create Account */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <DarkBtn onClick={onBack}>← Back</DarkBtn>
        <YellowBtn onClick={handleCreate} disabled={loading}>
          {loading ? 'Creating…' : 'Create Account'}
        </YellowBtn>
      </div>

      <PrivacyNote />
    </div>
  );
};

// STEP 4 — Success
const StepSuccess = ({ onDashboard }) => (
  <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
    {/* Green circle check */}
    <div style={{
      width: '80px', height: '80px', borderRadius: '50%',
      backgroundColor: '#e6f9ee',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '0 auto 20px',
    }}>
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none"
        stroke="#28a745" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>

    <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a', marginBottom: '14px' }}>
      Account Successfully Created!
    </h2>
    <p style={{ fontSize: '14px', color: '#444', lineHeight: 1.6, marginBottom: '28px' }}>
      Your Smart Grama Sewa account is now active.<br />
      You can now access GN services directly<br />
      from your personal dashboard.
    </p>

    <YellowBtn onClick={onDashboard}>Go to dashboard</YellowBtn>
  </div>
);

// Main SignUp component
const SignUp = () => {
  const [step, setStep] = useState(1); // 1 | 2 | 3 | 4

  const [form, setForm] = useState({
    // Step 1
    fullName: '', nic: '', dob: '', address: '',
    // Step 2
    email: '', mobile: '', district: '', dsDiv: '', gnDiv: '',
    // Step 3
    username: '', password: '', confirm: '',
  });

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const goToDashboard = () => {
    window.location.href = '/dashboard'; 
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#fefde8',
      fontFamily: 'Nunito, system-ui, sans-serif',
    }}>

      {/* Logo */}
      <div style={{ padding: '20px 28px 4px' }}>
        <img src="/logo.png" alt="Smart Grama Sewa" style={{ height: '100px', width: 'auto' }} />
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 16px 48px',
      }}>

        {/* Title */}
        <h1 style={{
          fontSize: '44px', fontWeight: 900,
          color: '#1a1a1a', letterSpacing: '-1px',
          margin: '0 0 28px', textAlign: 'center',
        }}>
          Sign Up
        </h1>

        {/* Step indicator */}
        <div style={{ width: '100%', maxWidth: '560px', marginBottom: '8px' }}>
          <StepIndicator current={step > 3 ? 4 : step} />
        </div>

        {/* White card */}
        <div style={{
          width: '100%',
          maxWidth: '760px',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '32px 36px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
        }}>
          {step === 1 && <Step1 data={form} onChange={update} onNext={() => setStep(2)} />}
          {step === 2 && <Step2 data={form} onChange={update} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && <Step3 data={form} onChange={update} onSubmit={() => setStep(4)} onBack={() => setStep(2)} />}
          {step === 4 && <StepSuccess onDashboard={goToDashboard} />}
        </div>

      </div>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#6A2301',
        color: '#ffffff',
        textAlign: 'center',
        padding: '14px 16px',
        fontSize: '13px',
        fontWeight: 600,
      }}>
        ©2026 Smart Grama Sewa
      </footer>

    </div>
  );
};

export default SignUp;
