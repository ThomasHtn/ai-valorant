import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Resource } from '@angular/core';

/**
 * Reads a resource's value without throwing: `Resource.value()` throws once the resource is in
 * error, so templates and computeds go through this guard instead.
 */
export function resourceValue<T, F>(resource: Resource<T>, fallback: F): T | F {
  return resource.hasValue() ? resource.value() : fallback;
}

/** Whether the resource failed because the backend has no data for the request (HTTP 404). */
export function isNotFound(resource: Resource<unknown>): boolean {
  const error = resource.error();
  return error instanceof HttpErrorResponse && error.status === HttpStatusCode.NotFound;
}
