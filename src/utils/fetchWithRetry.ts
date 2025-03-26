interface RetryConfig {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    headers?: Record<string, string>;
}

export async function fetchWithRetry(
    url: string,
    {
        maxRetries = 3,
        initialDelay = 1000,
        maxDelay = 10000,
        backoffFactor = 2,
        headers = {}
    }: RetryConfig = {}
) {
    let lastError: Error | null = null;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, { headers });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            lastError = error as Error;

            if (attempt === maxRetries) {
                break;
            }

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));

            // Exponential backoff with max delay
            delay = Math.min(delay * backoffFactor, maxDelay);
        }
    }

    console.error(`Failed after ${maxRetries} retries:`, lastError);
    throw lastError;
} 