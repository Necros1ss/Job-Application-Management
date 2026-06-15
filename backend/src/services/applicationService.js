import { applicationRepository } from "../repositories/applicationRepository.js";

export const applicationService = {
  getApplications: async (user) => {
    if (user.role === "candidate") {
      return await applicationRepository.findByCandidateId(user.id);
    }
    return await applicationRepository.findAll();
  },

  getRecruiterApplications: async (recruiterId, options) => {
    const applications = await applicationRepository.findForRecruiter(recruiterId, options);
    const total = await applicationRepository.countForRecruiter(recruiterId, options.jobPostId);
    
    return {
      applications,
      pagination: {
        total,
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(total / options.limit)
      }
    };
  },

  getApplicationById: async (id) => {
    const application = await applicationRepository.findById(id);
    if (!application) throw new Error("Application not found");
    return application;
  },

  applyForJob: async (candidateId, { jobPostId, coverLetter }, cvFile) => {
    const application = await applicationRepository.create(
      candidateId, 
      jobPostId, 
      {
        path: cvFile.path,
        name: cvFile.originalname,
        mimetype: cvFile.mimetype,
        size: cvFile.size
      }, 
      coverLetter
    );

    await applicationRepository.addEvent(
      application.id,
      candidateId,
      "applied",
      "Job Applied",
      "Candidate submitted a new application"
    );

    return application;
  },

  updateStatus: async (id, status, actorId) => {
    const application = await applicationRepository.updateStatus(id, status);
    
    await applicationRepository.addEvent(
      id,
      actorId,
      "status_changed",
      "Status Updated",
      `Application status updated to ${status}`,
      { status }
    );

    return application;
  },

  updateRating: async (id, rating, actorId) => {
    const application = await applicationRepository.updateRating(id, rating);
    
    await applicationRepository.addEvent(
      id,
      actorId,
      "rating_updated",
      "Rating Updated",
      `Application rating updated to ${rating}`,
      { rating }
    );

    return application;
  },

  getNotes: async (applicationId) => {
    return await applicationRepository.getNotes(applicationId);
  },

  addNote: async (applicationId, recruiterId, note) => {
    return await applicationRepository.addNote(applicationId, recruiterId, note);
  },

  updateNote: async (noteId, note) => {
    return await applicationRepository.updateNote(noteId, note);
  },

  deleteNote: async (noteId) => {
    return await applicationRepository.deleteNote(noteId);
  },
};
