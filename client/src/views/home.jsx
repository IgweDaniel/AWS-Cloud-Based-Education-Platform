import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 *
 * @returns
 *
 * what about the view on the frontend that starts a stream for a classID, collect the classId as input on the homepage #codebase
 */
const Home = () => {
  const [classId, setClassId] = useState("");
  const navigate = useNavigate();

  const handleJoinClass = (role) => {
    if (!classId.trim()) {
      alert("Please enter a class ID");
      return;
    }
    navigate(`/class/${classId}?role=${role}`);
  };

  return (
    <div className="home-container">
      <h1>Welcome to Live Class Stream</h1>
      <div className="input-group">
        <input
          type="text"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          placeholder="Enter Class ID"
          className="class-input"
        />
      </div>
      <div className="button-group">
        <button
          onClick={() => handleJoinClass("MASTER")}
          className="btn btn-primary"
        >
          Start Teaching
        </button>
        <button
          onClick={() => handleJoinClass("VIEWER")}
          className="btn btn-secondary"
        >
          Join as Student
        </button>
      </div>
    </div>
  );
};

export default Home;
