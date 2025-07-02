import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  // Personal Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  passportNumber: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: [true, 'Gender is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  
  // Address Information
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required']
    },
    country: {
      type: String,
      required: [true, 'Country is required']
    }
  },
  
  // Sports Information
  primarySport: {
    type: String,
    required: [true, 'Primary sport is required'],
    enum: [
      'Wheelchair Basketball',
      'Para Swimming',
      'Para Athletics',
      'Wheelchair Tennis',
      'Para Powerlifting',
      'Para Cycling',
      'Wheelchair Rugby',
      'Para Table Tennis',
      'Para Badminton',
      'Para Archery',
      'Para Shooting',
      'Para Judo',
      'Para Taekwondo',
      'Para Rowing',
      'Para Canoe',
      'Para Triathlon',
      'Para Alpine Skiing',
      'Para Cross-Country Skiing',
      'Para Snowboarding',
      'Para Ice Hockey',
      'Other'
    ]
  },
  secondarySport: {
    type: String,
    enum: [
      'Wheelchair Basketball',
      'Para Swimming',
      'Para Athletics',
      'Wheelchair Tennis',
      'Para Powerlifting',
      'Para Cycling',
      'Wheelchair Rugby',
      'Para Table Tennis',
      'Para Badminton',
      'Para Archery',
      'Para Shooting',
      'Para Judo',
      'Para Taekwondo',
      'Para Rowing',
      'Para Canoe',
      'Para Triathlon',
      'Para Alpine Skiing',
      'Para Cross-Country Skiing',
      'Para Snowboarding',
      'Para Ice Hockey',
      'Other'
    ]
  },
  
  // Disability Information
  disabilityType: {
    type: String,
    required: [true, 'Disability type is required'],
    enum: [
      'Physical Impairment',
      'Visual Impairment',
      'Intellectual Impairment',
      'Hearing Impairment',
      'Multiple Disabilities',
      'Short Stature',
      'Limb Deficiency',
      'Hypertonia',
      'Ataxia',
      'Athetosis',
      'Spinal Cord Injury',
      'Cerebral Palsy',
      'Amputation',
      'Dwarfism',
      'Muscular Dystrophy',
      'Spina Bifida',
      'Polio',
      'Other'
    ]
  },
  disabilityClassification: {
    type: String,
    required: [true, 'Disability classification is required']
  },
  impairmentDescription: {
    type: String,
    required: [true, 'Impairment description is required']
  },
  
  // Medical Information
  emergencyContact: {
    name: {
      type: String,
      required: [true, 'Emergency contact name is required']
    },
    relationship: {
      type: String,
      required: [true, 'Relationship is required']
    },
    phone: {
      type: String,
      required: [true, 'Emergency contact phone is required']
    }
  },
  medicalConditions: {
    type: String
  },
  medications: {
    type: String
  },
  allergies: {
    type: String
  },
  
  // Sports History
  experienceLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Elite'],
    required: [true, 'Experience level is required']
  },
  yearsOfExperience: {
    type: Number,
    required: [true, 'Years of experience is required'],
    min: 0
  },
  achievements: {
    type: String
  },
  coachName: {
    type: String
  },
  coachContact: {
    type: String
  },
  
  // ID Card Information
  playerId: {
    type: String,
    unique: true
  },
  profilePhoto: {
    type: String
  },
  idCardGenerated: {
    type: Boolean,
    default: false
  },
  idCardSent: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  registrationDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate unique player ID before saving
playerSchema.pre('save', function(next) {
  if (!this.playerId) {
    // Special condition for Bhavanaben Chaudhary
    const firstName = this.firstName?.toLowerCase();
    const lastName = this.lastName?.toLowerCase();
    const dob = this.dateOfBirth;
    
    // Check if it matches Bhavanaben Chaudhary
    if ((firstName === 'bhavana' || firstName === 'bhavanaben' || firstName ==='BHAVANBEN') && 
        (lastName === 'chaudhary' || lastName === 'CHAUDHARY')) {
      this.playerId = 'PS20250001';
      console.log('Special player ID assigned: PS20250001 for Bhavanaben Chaudhary');
    } else {
      // Generate regular player ID
      const year = new Date().getFullYear();
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      this.playerId = `PS${year}${randomNum}`;
    }
  }
  this.lastUpdated = new Date();
  next();
});

// Virtual for full name
playerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
playerSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Ensure virtual fields are serialized
playerSchema.set('toJSON', { virtuals: true });
playerSchema.set('toObject', { virtuals: true });

// Create indexes for better query performance
playerSchema.index({ registrationDate: -1 });
playerSchema.index({ primarySport: 1 });
playerSchema.index({ disabilityType: 1 });
playerSchema.index({ experienceLevel: 1 });
playerSchema.index({ 'address.city': 1 });
playerSchema.index({ 'address.state': 1 });
playerSchema.index({ idCardGenerated: 1 });
playerSchema.index({ idCardSent: 1 });

// Compound indexes for common queries
playerSchema.index({ primarySport: 1, experienceLevel: 1 });
playerSchema.index({ disabilityType: 1, primarySport: 1 });
playerSchema.index({ registrationDate: -1, idCardGenerated: 1 });

const Player = mongoose.model('Player', playerSchema);

export default Player; 