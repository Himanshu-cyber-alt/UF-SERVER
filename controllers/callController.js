import { createCall, acceptCall, endCall, getCallById } from "../models/call.js";

export const startCall = async (req, res) => {
  try {
    const { patient_id, doctor_id } = req.body;
    console.log(patient_id , patient_id);
    if (!patient_id || !doctor_id) {
      return res.status(400).json({ message: "Patient ID and Doctor ID required" });
    }
    const call = await createCall(patient_id, doctor_id);
    res.status(201).json(call);
  } catch (err) {
    console.error("Error starting call:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const acceptIncomingCall = async (req, res) => {
  try {
    const { call_id } = req.body;
    if (!call_id) return res.status(400).json({ message: "Call ID required" });

    const call = await acceptCall(call_id);
    res.json(call);
  } catch (err) {
    console.error("Error accepting call:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const endCallSession = async (req, res) => {
  try {
    const { call_id } = req.body;
    if (!call_id) return res.status(400).json({ message: "Call ID required" });

    const call = await endCall(call_id);
    res.json(call);
  } catch (err) {
    console.error("Error ending call:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCall = async (req, res) => {
  try {
    const { id } = req.params;
    const call = await getCallById(id);
    if (!call) return res.status(404).json({ message: "Call not found" });
    res.json(call);
  } catch (err) {
    console.error("Error fetching call:", err);
    res.status(500).json({ message: "Server error" });
  }
};

