import { jobPostRepository } from "../repositories/jobPostRepository.js";

const EMPLOYMENT_TYPES = new Set(["full-time", "part-time", "contract", "internship"]);
const EXPERIENCE_LEVELS = new Set(["0-1 years", "1-3 years", "3-5 years", "5+ years"]);

const buildJobPostWhere = ({ search, location, employmentType, experience, salaryMin, salaryMax }) => {
  const clauses = ["COALESCE(jp.status::text, 'active') = 'active'"];
  const params = [];
  const salaryNumberSql = "COALESCE(NULLIF(replace(substring(COALESCE(jp.salary, '') from '[0-9][0-9,]*'), ',', ''), '')::numeric, 0)";

  if (search) {
    params.push(search);
    const index = params.length;
    clauses.push(
      `(to_tsvector('english', COALESCE(jp.title, '') || ' ' || COALESCE(jp.description, '')) @@ plainto_tsquery('english', $${index})
        OR COALESCE(r.company_name, '') ILIKE '%' || $${index} || '%')`
    );
  }

  if (location) {
    params.push(location);
    clauses.push(`COALESCE(jp.location, '') ILIKE '%' || $${params.length} || '%'`);
  }

  if (employmentType && EMPLOYMENT_TYPES.has(employmentType)) {
    params.push(employmentType);
    clauses.push(`LOWER(COALESCE(jp.employment_type, '')) = $${params.length}`);
  }

  if (experience && EXPERIENCE_LEVELS.has(experience)) {
    params.push(experience);
    clauses.push(`COALESCE(jp.experience, '') = $${params.length}`);
  }

  if (salaryMin !== null) {
    params.push(salaryMin);
    clauses.push(`${salaryNumberSql} >= $${params.length}`);
  }

  if (salaryMax !== null) {
    params.push(salaryMax);
    clauses.push(`${salaryNumberSql} <= $${params.length}`);
  }

  return {
    whereSql: `WHERE ${clauses.join(" AND ")}`,
    params,
  };
};

const mapRow = (row) => ({
  id: row.id,
  recruiterId: row.recruiter_id,
  title: row.title,
  description: row.description || "",
  location: row.location || "",
  salary: row.salary || "",
  deadline: row.deadline,
  createdAt: row.created_at,
  experience: row.experience,
  employment_type: row.employment_type,
  responsibilities: row.responsibilities,
  requirements: row.requirements,
  companyName: row.company_name || "Unknown Company",
  phone: row.phone || "",
  website: row.website || "",
  email: row.email || "",
  address: row.address || "",
  industry: row.industry || "",
  applicantCount: Number(row.applicant_count || 0),
});

export const jobPostService = {
  getJobPosts: async (query) => {
    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 50);
    const offset = (page - 1) * limit;

    const filters = {
      search: (query.search || "").toString().trim(),
      location: (query.location || "").toString().trim(),
      employmentType: (query.employment_type || "").toString().trim().toLowerCase(),
      experience: (query.experience || "").toString().trim(),
      salaryMin: query.salary_min ? Number(query.salary_min) : null,
      salaryMax: query.salary_max ? Number(query.salary_max) : null,
    };

    const { whereSql, params } = buildJobPostWhere(filters);
    const total = await jobPostRepository.countAll({ whereSql, params });
    const rows = await jobPostRepository.findAll({ 
      whereSql, 
      params, 
      limit, 
      offset, 
      sort: query.sort 
    });

    return {
      data: rows.map(mapRow),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  getMine: async (recruiterId) => {
    const rows = await jobPostRepository.findMine(recruiterId);
    return rows.map(mapRow);
  },

  getById: async (id) => {
    const row = await jobPostRepository.findById(id);
    if (!row) throw new Error("Job post not found");
    return mapRow(row);
  },

  create: async (recruiterId, data) => {
    return await jobPostRepository.create({ ...data, recruiter_id: recruiterId });
  },

  update: async (id, recruiterId, data) => {
    const updated = await jobPostRepository.update(id, recruiterId, data);
    if (!updated) throw new Error("Job post not found or permission denied");
    return true;
  },

  delete: async (id, recruiterId) => {
    const deleted = await jobPostRepository.delete(id, recruiterId);
    if (!deleted) throw new Error("Job post not found or permission denied");
    return true;
  },
};
