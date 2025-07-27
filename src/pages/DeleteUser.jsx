import React, { useEffect, useState } from "react";

const DeleteUser = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:3001/api/users/list");
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.success) setUsers(data.users);
      else setError("Failed to load users");
    } catch (err) {
      setError("Network error while loading users");
      setUsers([]);
      console.error(err);
    }
    setLoading(false);
  };

  const deleteUser = async (name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`))
      return;
    setDeleting(name);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:3001/api/users/delete/${encodeURIComponent(name)}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setUsers(users.filter((u) => u.name !== name));
      } else {
        setError(data.message || "Failed to delete user");
      }
    } catch (err) {
      setError("Network error while deleting user");
      console.error(err);
    }
    setDeleting(null);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "60px auto",
        fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
        padding: 20,
        backgroundColor: "#222",
        color: "#eee",
        borderRadius: 12,
        boxShadow: "0 0 20px rgba(0,0,0,0.7)",
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h1
        style={{
          marginBottom: 30,
          fontWeight: "700",
          fontSize: 28,
          textAlign: "center",
          color: "#4caf50",
        }}
      >
        User Management
      </h1>

      {loading && (
        <p
          style={{
            textAlign: "center",
            fontSize: 18,
            color: "#aaa",
            marginBottom: 20,
          }}
        >
          Loading users...
        </p>
      )}

      {error && (
        <p
          style={{
            textAlign: "center",
            color: "#ff6b6b",
            marginBottom: 20,
            fontWeight: "600",
            backgroundColor: "#3a1e1e",
            padding: 12,
            borderRadius: 8,
          }}
        >
          {error}
        </p>
      )}

      {!loading && users.length === 0 && !error && (
        <p style={{ textAlign: "center", color: "#999" }}>No users found.</p>
      )}

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          flexGrow: 1,
          overflowY: "auto",
          maxHeight: 350,
          marginBottom: 20,
          borderTop: "1px solid #444",
          borderBottom: "1px solid #444",
        }}
      >
        {users.map(({ name }) => (
          <li
            key={name}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 0",
              borderBottom: "1px solid #444",
              fontSize: 16,
            }}
          >
            <span>{name}</span>
            <button
              onClick={() => deleteUser(name)}
              disabled={deleting === name}
              style={{
                backgroundColor: deleting === name ? "#777" : "#d9534f",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: 6,
                cursor: deleting === name ? "not-allowed" : "pointer",
                transition: "background-color 0.3s ease",
              }}
              onMouseEnter={(e) => {
                if (deleting !== name)
                  e.currentTarget.style.backgroundColor = "#c9302c";
              }}
              onMouseLeave={(e) => {
                if (deleting !== name)
                  e.currentTarget.style.backgroundColor = "#d9534f";
              }}
            >
              {deleting === name ? "Deleting..." : "Delete"}
            </button>
          </li>
        ))}
      </ul>

      <button
        onClick={fetchUsers}
        disabled={loading}
        style={{
          alignSelf: "center",
          padding: "12px 28px",
          fontSize: 16,
          borderRadius: 8,
          border: "none",
          backgroundColor: loading ? "#555" : "#4caf50",
          color: "white",
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: "0 4px 12px rgba(76, 175, 80, 0.5)",
          transition: "background-color 0.3s ease",
        }}
      >
        Refresh List
      </button>
    </div>
  );
};

export default DeleteUser;
