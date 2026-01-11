import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ApiTester = () => {
  const [testResult, setTestResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testHealthEndpoint = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/health`);
      const data = await response.json();
      setTestResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to the API');
    } finally {
      setLoading(false);
    }
  };

  const testCustomEndpoint = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/test`);
      const data = await response.json();
      setTestResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to the API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>API Connection Tester</CardTitle>
        <CardDescription>Test the connection to the backend API</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Button onClick={testHealthEndpoint} disabled={loading}>
            Test Health Endpoint
          </Button>
          <Button onClick={testCustomEndpoint} disabled={loading} variant="outline">
            Test Custom Endpoint
          </Button>
        </div>

        {loading && <p>Loading...</p>}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {testResult && (
          <div className="p-4 border rounded-md bg-muted">
            <h3 className="font-medium mb-2">Response:</h3>
            <pre className="text-sm overflow-auto p-2 bg-card rounded">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        If you see a 500 error, check that your API keys are properly configured in the backend .env file.
      </CardFooter>
    </Card>
  );
};

export default ApiTester;