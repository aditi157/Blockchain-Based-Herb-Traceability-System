/*
  Fake users database
  Each object represents ONE ORGANIZATION account
  All roles now have unique IDs
*/

const fakeUsers = [
  // ===== FARMERS =====
  {
    id: "FARMER-001",
    role: "Farmer",
    email: "farmer1@demo.com",
    password: "farmer135",
    organizationName: "Green Valley Herbal Farm",
    location: "Uttarakhand, India"
  },
  {
    id: "FARMER-002",
    role: "Farmer",
    email: "farmer2@demo.com",
    password: "farmer135",
    organizationName: "Himalayan Roots Farm",
    location: "Himachal Pradesh, India"
  },

  // ===== LABS =====
  {
    id: "LAB-101",
    role: "Laboratory",
    email: "lab1@demo.com",
    password: "lab135",
    organizationName: "GreenLeaf Testing Labs",
    location: "Bangalore, India"
  },
  {
    id: "LAB-102",
    role: "Laboratory",
    email: "lab2@demo.com",
    password: "lab135",
    organizationName: "AyurCert Labs",
    location: "Hyderabad, India"
  },

  // ===== MANUFACTURERS =====
  {
    id: "MANU-201",
    role: "Manufacturer",
    email: "manu1@demo.com",
    password: "manu135",
    organizationName: "AyurHerb Pharmaceuticals",
    location: "Kerala, India"
  },

  // ===== CONSUMERS =====
  {
    id: "CONS-301",
    role: "Consumer",
    email: "user1@demo.com",
    password: "user135",
    organizationName: "Individual Consumer",
    location: "India"
  }
]

export default fakeUsers
