/**
 * Custom Jest Matchers and Reusable Assertions
 * Provide domain-specific assertions for API responses
 */

const { HTTP_STATUS, ERROR_CODES } = require("./testConstants");

/**
 * Assert a successful empty response (200 with empty array)
 * @param {Object} response - Supertest response object
 */
function assertEmptySuccess(response) {
  expect(response.status).toBe(HTTP_STATUS.OK);
  expect(response.body).toEqual([]);
}

/**
 * Assert a successful response with array data
 * @param {Object} response - Supertest response object
 * @param {number} expectedLength - Optional expected array length
 */
function assertArraySuccess(response, expectedLength) {
  expect(response.status).toBe(HTTP_STATUS.OK);
  expect(Array.isArray(response.body)).toBe(true);
  
  if (expectedLength !== undefined) {
    expect(response.body.length).toBe(expectedLength);
  }
}

/**
 * Assert a successful response with data property
 * @param {Object} response - Supertest response object
 * @param {string} dataKey - Property name containing the data
 * @param {number} expectedLength - Optional expected array length
 */
function assertDataSuccess(response, dataKey, expectedLength) {
  expect(response.status).toBe(HTTP_STATUS.OK);
  expect(Array.isArray(response.body[dataKey])).toBe(true);
  
  if (expectedLength !== undefined) {
    expect(response.body[dataKey].length).toBe(expectedLength);
  }
}

/**
 * Assert a 201 Created response with resource
 * @param {Object} response - Supertest response object
 * @param {string} resourceKey - Property name of created resource
 * @returns {Object} The created resource
 */
function assertCreated(response, resourceKey) {
  expect(response.status).toBe(HTTP_STATUS.CREATED);
  expect(response.body[resourceKey]).toBeDefined();
  return response.body[resourceKey];
}

/**
 * Assert a validation error response (400)
 * @param {Object} response - Supertest response object
 */
function assertValidationError(response) {
  expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
  expect(response.body.error).toBeDefined();
  expect(response.body.errorCode).toBe(ERROR_CODES.VALIDATION);
}

/**
 * Assert a not found error (404)
 * @param {Object} response - Supertest response object
 */
function assertNotFound(response) {
  expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
  expect(response.body.error).toBeDefined();
}

/**
 * Assert a conflict error (409)
 * @param {Object} response - Supertest response object
 */
function assertConflict(response) {
  expect(response.status).toBe(HTTP_STATUS.CONFLICT);
  expect(response.body.error).toBeDefined();
  expect(response.body.errorCode).toBe(ERROR_CODES.CONFLICT);
}

/**
 * Assert an error response with specific status and error code
 * @param {Object} response - Supertest response object
 * @param {number} status - Expected HTTP status
 * @param {string} errorCode - Expected error code
 */
function assertError(response, status, errorCode) {
  expect(response.status).toBe(status);
  expect(response.body.error).toBeDefined();
  expect(response.body.errorCode).toBe(errorCode);
}

module.exports = {
  assertEmptySuccess,
  assertArraySuccess,
  assertDataSuccess,
  assertCreated,
  assertValidationError,
  assertNotFound,
  assertConflict,
  assertError,
};
