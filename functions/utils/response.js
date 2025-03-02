const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
  "Access-Control-Allow-Headers":
    "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent",
  "Access-Control-Allow-Methods": "OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD",
};

const formatResponse = (statusCode, body, additionalHeaders = {}) => {
  return {
    statusCode,
    headers: {
      ...corsHeaders,
      ...additionalHeaders,
    },
    body: JSON.stringify(body),
  };
};

const successResponse = (data, statusCode = 200, additionalHeaders = {}) => {
  return formatResponse(statusCode, data, additionalHeaders);
};

const errorResponse = (error, statusCode = 500, additionalHeaders = {}) => {
  console.error("Error:", error);
  const errorMessage = error instanceof Error ? error.message : error;
  return formatResponse(statusCode, { error: errorMessage }, additionalHeaders);
};

module.exports = {
  successResponse,
  errorResponse,
  formatResponse,
};
