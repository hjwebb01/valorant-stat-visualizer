import { supabase } from '@/lib/supabase'

export default async function DatabaseTest() {
  try {
    const { data, error } = await supabase.from('players').select('*')

    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <h3 className="font-bold text-lg mb-2">Database Connection Test</h3>
        {error ? (
          <div className="text-red-600">
            <p className="font-semibold">Error:</p>
            <p>{error.message}</p>
          </div>
        ) : (
          <div className="text-green-600">
            <p className="font-semibold">Success!</p>
            <p>Connected to Supabase. Found {data?.length || 0} players in database.</p>
            <details className="mt-2">
              <summary className="cursor-pointer">View raw response</summary>
              <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto">
                {JSON.stringify({ data, error }, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    )
  } catch (err) {
    return (
      <div className="p-4 bg-red-100 rounded-lg">
        <h3 className="font-bold text-lg mb-2">Database Connection Test</h3>
        <p className="text-red-600">
          <span className="font-semibold">Exception:</span> {err instanceof Error ? err.message : 'Unknown error'}
        </p>
      </div>
    )
  }
}