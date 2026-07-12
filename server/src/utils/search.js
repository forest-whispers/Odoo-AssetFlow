export const buildSearchQuery = (search, fields = []) => {
    if (!search || fields.length === 0) {
        return {};
    }
    return {
        $or: fields.map((field) => ({
            [field]: {
                $regex: search,
                $options: "i",
            },
        })),
    };
};