import { globalExclusions } from '#functions/presets';

export function excludeUsingGlobals(entries: Map<string, number>): Map<string, number> {
	for (const exclusion of globalExclusions) {
		entries.delete(exclusion);
	}

	return entries;
}
