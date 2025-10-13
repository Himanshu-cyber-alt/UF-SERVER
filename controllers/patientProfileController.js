
// import {
//   createProfile as createProfileModel,
//   getProfileByPatientId,
//   updateProfile as updateProfileModel,
// } from "../models/patientProfileModel.js";

// // POST /api/patients/profile → create
// export const createProfile = async (req, res) => {
//   try {
//     const profile = await createProfileModel(req.body);
//     res.status(201).json(profile);
//   } catch (err) {
//     console.error("Error creating profile:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // GET /api/patients/profile/:patient_id → fetch
// export const getProfile = async (req, res) => {
//   try {
//     const { patient_id } = req.params;
//     const profile = await getProfileByPatientId(patient_id);
//     if (!profile) return res.status(404).json({ message: "Profile not found" });
//     res.json(profile);
//   } catch (err) {
//     console.error("Error fetching profile:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // PUT /api/patients/profile/:patient_id → update
// export const updateProfile = async (req, res) => {
//   try {
//     const { patient_id } = req.params;
//     const updatedProfile = await updateProfileModel(patient_id, req.body);
//     if (!updatedProfile)
//       return res.status(404).json({ message: "Profile not found" });
//     res.json(updatedProfile);
//   } catch (err) {
//     console.error("Error updating profile:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };


// import {
//   createProfile as createProfileModel,
//   getProfileByPatientId,
//   updateProfile as updateProfileModel,
// }
//  from "../models/patientProfileModel.js";


// // POST → create or update if exists
// export const createOrUpdateProfile = async (req, res) => {
//   try {
//     const { patient_id } = req.body;
//     console.log(patient_id +" this is patinet id ")

//     if (!patient_id) return res.status(400).json({ message: "Patient ID required" });

//     const existingProfile = await getProfileByPatientId(patient_id);

//     if (existingProfile) {
//       const updatedProfile = await updateProfileModel(patient_id, req.body);
//       return res.json(updatedProfile);
//     } else {
//       const profile = await createProfileModel(req.body);
//       return res.status(201).json(profile);
//     }
//   } catch (err) {
//     console.error("Error creating/updating profile:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// GET /:patient_id → fetch
// export const getProfile = async (req, res) => {
//   try {
//     const { patient_id } = req.params;
//     const profile = await getProfileByPatientId(patient_id);
//     if (!profile) return res.status(404).json({ message: "Profile not found" });
//     res.json(profile);
//   } catch (err) {
//     console.error("Error fetching profile:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };


import {
  createProfile as createProfileModel,
  updateProfile as updateProfileModel,
  getProfileByPatientId,
} from "../models/patientProfileModel.js";

// CREATE profile
export const createProfile = async (req, res) => {
  try {
    const { patient_id } = req.body;
    if (!patient_id) {
      return res.status(400).json({ message: "Patient ID is required" });
    }

    const profile = await createProfileModel(patient_id, req.body);
    res.status(201).json(profile);
  } catch (err) {
    console.error("Error creating profile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE profile
export const updateProfile = async (req, res) => {
  try {
    const { patient_id } = req.params;
    if (!patient_id) {
      return res.status(400).json({ message: "Patient ID is required" });
    }

    const updatedProfile = await updateProfileModel(patient_id, req.body);
    if (!updatedProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(updatedProfile);
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET profile
export const getProfile = async (req, res) => {
  try {
    const { patient_id } = req.params;
    const profile = await getProfileByPatientId(patient_id);

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(profile);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Server error" });
  }
};


