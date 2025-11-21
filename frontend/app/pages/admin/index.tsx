"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/layout/Layout";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

interface Tournament {
  id: number;
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  initial_balance: number;
  prize_pool: number;
  is_active: boolean;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_time: "",
    end_time: "",
    initial_balance: 10000,
    prize_pool: 5000,
  });

  useEffect(() => {
    // Check if user is authenticated and is admin
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    if (user && !user.is_admin) {
      router.push("/dashboard");
      return;
    }

    // If user is admin, fetch tournaments
    if (user && user.is_admin) {
      fetchTournaments();
    }
  }, [user, isAuthenticated, router]);

  const fetchTournaments = async () => {
    try {
      const response = await api.get("/api/admin/tournaments");
      setTournaments(response.data);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes("balance") || name.includes("pool") ? parseFloat(value) : value,
    }));
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
      };

      const response = await api.post("/api/admin/tournaments", payload);
      
      alert("✅ Tournament created successfully!");
      setTournaments([...tournaments, response.data]);
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        start_time: "",
        end_time: "",
        initial_balance: 10000,
        prize_pool: 5000,
      });
    } catch (error: any) {
      const errorMessage = error.message || error.response?.data?.detail || "Failed to create tournament";
      console.error("Tournament creation error:", error);
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTournament = async (id: number) => {
    if (!confirm("Are you sure you want to delete this tournament?")) return;

    try {
      await api.delete(`/api/admin/tournaments/${id}`);
      setTournaments(tournaments.filter((t) => t.id !== id));
      alert("✅ Tournament deleted successfully!");
    } catch (error: any) {
      alert(`❌ Error: ${error.response?.data?.detail || "Failed to delete tournament"}`);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

        {/* CREATE TOURNAMENT FORM */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-10">
          <h2 className="text-2xl font-bold mb-6">Create Tournament</h2>
          
          <form onSubmit={handleCreateTournament} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tournament Name */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Tournament Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Winter Trading Cup 2025"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

              {/* Initial Balance */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Initial Balance ($) *
                </label>
                <input
                  type="number"
                  name="initial_balance"
                  value={formData.initial_balance}
                  onChange={handleInputChange}
                  placeholder="10000"
                  required
                  min="1000"
                  step="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

              {/* Prize Pool */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Prize Pool ($)
                </label>
                <input
                  type="number"
                  name="prize_pool"
                  value={formData.prize_pool}
                  onChange={handleInputChange}
                  placeholder="5000"
                  min="0"
                  step="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter tournament details..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {loading ? "Creating..." : "Create Tournament"}
            </button>
          </form>
        </div>

        {/* TOURNAMENTS LIST */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">All Tournaments</h2>

          {tournaments.length === 0 ? (
            <p className="text-gray-500">No tournaments created yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Start Date</th>
                    <th className="px-4 py-3 text-left">End Date</th>
                    <th className="px-4 py-3 text-right">Initial Balance</th>
                    <th className="px-4 py-3 text-right">Prize Pool</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tournaments.map((tournament) => (
                    <tr key={tournament.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold">{tournament.name}</td>
                      <td className="px-4 py-3">
                        {new Date(tournament.start_time).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(tournament.end_time).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">${tournament.initial_balance}</td>
                      <td className="px-4 py-3 text-right">${tournament.prize_pool}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            tournament.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {tournament.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteTournament(tournament.id)}
                          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}