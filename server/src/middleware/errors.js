import { ZodError } from "zod";

export const notFound = (req, res) => res.status(404).json({ message: "Not found." });

// Express 5 forwards errors from async routes here automatically.
export const errorHandler = (err, req, res, next) => {
  if (err instanceof ZodError) return res.status(400).json({ message: err.issues[0]?.message || "Invalid input." });
  if (err.name === "CastError") return res.status(404).json({ message: "Not found." });
  if (err.name === "ValidationError") return res.status(400).json({ message: "Invalid input." });
  if (err.code === 11000) return res.status(409).json({ message: "That already exists." });
  if (err.status && err.status < 500) return res.status(err.status).json({ message: "Invalid request." });
  console.error(err);
  res.status(500).json({ message: "Something went wrong. Please try again." });
};
