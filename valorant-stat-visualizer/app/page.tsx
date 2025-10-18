import Image from "next/image";
import DatabaseTest from "@/components/DatabaseTest";
import PlayerStatsDisplay from "@/components/PlayerStatsDisplay";

export default function Home() {
  return (
    <div className="font-sans min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <Image
            className="dark:invert mx-auto mb-4"
            src="/next.svg"
            alt="Next.js logo"
            width={120}
            height={30}
            priority
          />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Valorant Match Tracker
          </h1>
          <p className="text-lg text-gray-600">
            Import and analyze your Valorant matches from tracker.gg
          </p>
        </div>

        {/* Database Connection Test */}
        <div className="mb-8">
          <DatabaseTest />
        </div>

        {/* Player Statistics Display */}
        <div className="bg-white rounded-lg shadow-md">
          <PlayerStatsDisplay />
        </div>
      </main>
    </div>
  );
}
