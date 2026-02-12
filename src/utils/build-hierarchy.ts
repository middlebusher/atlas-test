/**
 * Build a hierarchy from file path sequences (Kerry Rodden sequences sunburst style).
 * Each path is split by delimiter; leaves get value = additions + deletions.
 */

export interface SeqNode {
  name: string;
  value?: number;
  additions?: number;
  deletions?: number;
  path?: string;
  children?: SeqNode[];
}

export interface FileEntry {
  path: string;
  additions: number;
  deletions: number;
}

/**
 * Build hierarchy from PR file entries.
 * Paths are split by "/"; leaves store value (additions+deletions) and add/del counts for coloring.
 */
export function buildHierarchy(
  files: FileEntry[],
  delimiter = "/"
): SeqNode {
  const root: SeqNode = { name: "root", children: [] };

  for (const file of files) {
    const parts = file.path.split(delimiter).filter(Boolean);
    if (parts.length === 0) continue;

    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLeaf = i === parts.length - 1;
      const children = current.children ?? (current.children = []);

      let child = children.find((c) => c.name === part);

      if (!child) {
        child = isLeaf
          ? {
              name: part,
              value: file.additions + file.deletions,
              additions: file.additions,
              deletions: file.deletions,
              path: file.path,
            }
          : { name: part, children: [] };
        children.push(child);
      } else if (isLeaf) {
        // Duplicate path (edge case): aggregate
        child.value = (child.value ?? 0) + file.additions + file.deletions;
        child.additions = (child.additions ?? 0) + file.additions;
        child.deletions = (child.deletions ?? 0) + file.deletions;
      }

      current = child;
    }
  }

  return root;
}
