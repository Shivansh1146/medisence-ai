"use client";

import { apiClient } from "@/lib/api";
import {
  Activity,
  FileText,
  Loader2,
  Pill,
  Search,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface SearchResults {
  doctors: any[];
  symptoms: any[];
  medicines: any[];
  articles: any[];
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<
    "all" | "doctors" | "symptoms" | "medicines"
  >("all");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const response = await apiClient.search.query(
        query,
        searchType === "all" ? undefined : searchType
      );
      setResults(response.data.results);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to perform search");
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults(null);
    setSearched(false);
  };

  const totalResults = results
    ? (results.doctors?.length || 0) +
      (results.symptoms?.length || 0) +
      (results.medicines?.length || 0) +
      (results.articles?.length || 0)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search</h1>
          <p className="text-gray-600">
            Search for doctors, symptoms, medicines, and health articles
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for doctors, symptoms, medicines..."
                className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {["all", "doctors", "symptoms", "medicines"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSearchType(type as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
                    searchType === type
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Search
                </>
              )}
            </button>
          </form>
        </div>

        {/* Search Results */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-indigo-600 mb-4" />
            <div className="text-xl">Searching...</div>
          </div>
        )}

        {!loading && searched && results && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {totalResults > 0
                  ? `Found ${totalResults} result${
                      totalResults !== 1 ? "s" : ""
                    } for "${query}"`
                  : `No results found for "${query}"`}
              </h2>
            </div>

            {/* Doctors */}
            {results.doctors && results.doctors.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  Doctors ({results.doctors.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.doctors.map((doctor: any, index: number) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {doctor.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {doctor.specialty}
                          </p>
                          {doctor.qualification && (
                            <p className="text-xs text-gray-500 mt-1">
                              {doctor.qualification}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Symptoms */}
            {results.symptoms && results.symptoms.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-red-600" />
                  Symptoms ({results.symptoms.length})
                </h3>
                <div className="space-y-3">
                  {results.symptoms.map((symptom: any, index: number) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
                    >
                      <h4 className="font-semibold text-gray-900 mb-2 capitalize">
                        {symptom.name}
                      </h4>
                      {symptom.info && (
                        <p className="text-sm text-gray-700">{symptom.info}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medicines */}
            {results.medicines && results.medicines.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-green-600" />
                  Medicines ({results.medicines.length})
                </h3>
                <div className="space-y-3">
                  {results.medicines.map((medicine: any, index: number) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
                    >
                      <h4 className="font-semibold text-gray-900 mb-2 capitalize">
                        {medicine.name}
                      </h4>
                      {medicine.info && (
                        <p className="text-sm text-gray-700">{medicine.info}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Articles */}
            {results.articles && results.articles.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Articles ({results.articles.length})
                </h3>
                <div className="space-y-3">
                  {results.articles.map((article: any, index: number) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {article.title}
                      </h4>
                      {article.description && (
                        <p className="text-sm text-gray-700">
                          {article.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Feature Info */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold text-gray-900 mb-2">
            ✅ Real Search Features:
          </h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>✅ Real-time search across all categories</li>
            <li>✅ Search doctors by name and specialty</li>
            <li>✅ Search symptoms and conditions</li>
            <li>✅ Search medicines and treatments</li>
            <li>✅ Filter by category</li>
            <li>✅ Fast search results</li>
            <li>✅ Autocomplete suggestions (ready to add)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
