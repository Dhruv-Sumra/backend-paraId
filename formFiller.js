// Browser Console Script to Fill Registration Form
// Copy and paste this into your browser console on the registration page

const fakePlayers = [
  {
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1-555-0123",
    dateOfBirth: "1995-03-15",
    gender: "Female",
    address: "123 Oak Street, Springfield, IL 62701",
    emergencyContact: {
      name: "Michael Johnson",
      relationship: "Father",
      phone: "+1-555-0124"
    },
    primarySport: "Wheelchair Basketball",
    experienceLevel: "Intermediate",
    disabilityType: "Spinal Cord Injury",
    medicalConditions: "None",
    previousExperience: "High school basketball team",
    goals: "Compete at national level"
  },
  {
    firstName: "David",
    lastName: "Chen",
    email: "david.chen@email.com",
    phone: "+1-555-0125",
    dateOfBirth: "1992-07-22",
    gender: "Male",
    address: "456 Pine Avenue, Portland, OR 97201",
    emergencyContact: {
      name: "Lisa Chen",
      relationship: "Sister",
      phone: "+1-555-0126"
    },
    primarySport: "Swimming",
    experienceLevel: "Advanced",
    disabilityType: "Amputation",
    medicalConditions: "Prosthetic leg",
    previousExperience: "College swimming team",
    goals: "Qualify for Paralympics"
  },
  {
    firstName: "Maria",
    lastName: "Garcia",
    email: "maria.garcia@email.com",
    phone: "+1-555-0127",
    dateOfBirth: "1988-11-08",
    gender: "Female",
    address: "789 Elm Road, Miami, FL 33101",
    emergencyContact: {
      name: "Carlos Garcia",
      relationship: "Husband",
      phone: "+1-555-0128"
    },
    primarySport: "Track and Field",
    experienceLevel: "Beginner",
    disabilityType: "Visual Impairment",
    medicalConditions: "Legally blind",
    previousExperience: "Recreational running",
    goals: "Learn proper techniques"
  }
];

// Function to fill form with fake data
function fillForm(playerIndex = 0) {
  const player = fakePlayers[playerIndex] || fakePlayers[0];
  
  // Fill basic information
  document.querySelector('input[name="firstName"]')?.value = player.firstName;
  document.querySelector('input[name="lastName"]')?.value = player.lastName;
  document.querySelector('input[name="email"]')?.value = player.email;
  document.querySelector('input[name="phone"]')?.value = player.phone;
  document.querySelector('input[name="dateOfBirth"]')?.value = player.dateOfBirth;
  document.querySelector('select[name="gender"]')?.value = player.gender;
  document.querySelector('textarea[name="address"]')?.value = player.address;
  
  // Fill emergency contact
  document.querySelector('input[name="emergencyContact.name"]')?.value = player.emergencyContact.name;
  document.querySelector('input[name="emergencyContact.relationship"]')?.value = player.emergencyContact.relationship;
  document.querySelector('input[name="emergencyContact.phone"]')?.value = player.emergencyContact.phone;
  
  // Fill sports information
  document.querySelector('select[name="primarySport"]')?.value = player.primarySport;
  document.querySelector('select[name="experienceLevel"]')?.value = player.experienceLevel;
  document.querySelector('input[name="disabilityType"]')?.value = player.disabilityType;
  document.querySelector('textarea[name="medicalConditions"]')?.value = player.medicalConditions;
  document.querySelector('textarea[name="previousExperience"]')?.value = player.previousExperience;
  document.querySelector('textarea[name="goals"]')?.value = player.goals;
  
  console.log(`Form filled with data for ${player.firstName} ${player.lastName}`);
}

// Function to get random player data
function fillRandomForm() {
  const randomIndex = Math.floor(Math.random() * fakePlayers.length);
  fillForm(randomIndex);
}

// Function to list available players
function listPlayers() {
  console.log('Available fake players:');
  fakePlayers.forEach((player, index) => {
    console.log(`${index}: ${player.firstName} ${player.lastName} - ${player.primarySport}`);
  });
}

// Make functions available globally
window.fillForm = fillForm;
window.fillRandomForm = fillRandomForm;
window.listPlayers = listPlayers;

console.log('Form filler loaded! Available commands:');
console.log('- fillForm(index) - Fill form with specific player (0-2)');
console.log('- fillRandomForm() - Fill form with random player');
console.log('- listPlayers() - Show all available players'); 