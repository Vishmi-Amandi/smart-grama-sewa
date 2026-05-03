import React from "react";

const Forms = () => {
  const forms = [
    { name: "Residence Certificate", file: "#" },
    { name: "NIC Application", file: "#" },
    { name: "Income Certificate", file: "#" },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Official Forms</h1>
      <div className="grid gap-4">
        {forms.map((form, index) => (
          <div key={index} className="p-4 bg-white shadow-md rounded-lg flex justify-between items-center border">
            <span className="font-medium">{form.name}</span>
            <a href={form.file} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Download
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Forms;