package com.jobtracker.repository;

import com.jobtracker.model.JobApplication;
import com.jobtracker.model.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    List<JobApplication> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
    Optional<JobApplication> findByIdAndOwnerId(Long id, Long ownerId);
    List<JobApplication> findByFollowUpDateLessThanEqualAndReminderSentFalseAndStatusIn(LocalDate date, Collection<Status> statuses);
}
