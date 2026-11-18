const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True for a GUID like the API's ids ("3f2504e0-4f89-11d3-9a0c-0305e82c3301"). */
export function isGuid(value: string): boolean {
    return GUID.test(value);
}
