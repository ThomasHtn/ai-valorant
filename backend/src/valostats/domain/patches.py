"""Game patches, e.g. '13.06'."""


def patch_sort_key(patch: str) -> tuple[int, ...]:
    return tuple(int(x) for x in patch.split("."))
