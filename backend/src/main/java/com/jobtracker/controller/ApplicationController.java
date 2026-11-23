package com.jobtracker.controller;

import com.jobtracker.model.JobApplication;
import com.jobtracker.model.Status;
import com.jobtracker.repository.JobApplicationRepository;
import com.jobtracker.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/** Every query is scoped to the signed-in user, so one user can never see or change another's applications. */
@RestController @RequestMapping("/api/applications")
public class ApplicationController {
    public record AppRequest(@NotBlank String company, @NotBlank String jobTitle, String location, String jobUrl,
                             String salary, Status status, LocalDate appliedDate, LocalDate followUpDate,
                             @Size(max = 2000) String notes) {}
    public record StatusRequest(@NotNull Status status) {}
    public record Stats(long total, Map<Status, Long> byStatus, long responseRate) {}

    private final JobApplicationRepository repo; private final UserRepository users;

    public ApplicationController(JobApplicationRepository repo, UserRepository users) { this.repo = repo; this.users = users; }

    private Long uid(Authentication auth) {
        return users.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found")).getId();
    }

    private JobApplication owned(Long id, Authentication auth) {
        return repo.findByIdAndOwnerId(id, uid(auth))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
    }

    private void apply(JobApplication a, AppRequest r) {
        a.setCompany(r.company().trim());
        a.setJobTitle(r.jobTitle().trim());
        a.setLocation(r.location()); a.setJobUrl(r.jobUrl()); a.setSalary(r.salary()); a.setNotes(r.notes());
        a.setStatus(r.status() == null ? Status.WISHLIST : r.status());
        a.setAppliedDate(r.appliedDate());
        if (!Objects.equals(a.getFollowUpDate(), r.followUpDate())) a.setReminderSent(false);
        a.setFollowUpDate(r.followUpDate());
        if (a.getStatus() == Status.APPLIED && a.getAppliedDate() == null) a.setAppliedDate(LocalDate.now());
    }

    @GetMapping
    public List<JobApplication> all(Authentication auth) { return repo.findByOwnerIdOrderByCreatedAtDesc(uid(auth)); }

    @GetMapping("/stats")
    public Stats stats(Authentication auth) {
        List<JobApplication> list = repo.findByOwnerIdOrderByCreatedAtDesc(uid(auth));
        Map<Status, Long> by = new EnumMap<>(Status.class);
        for (Status s : Status.values()) by.put(s, list.stream().filter(a -> a.getStatus() == s).count());
        long submitted = list.size() - by.get(Status.WISHLIST);
        long responded = by.get(Status.INTERVIEW) + by.get(Status.OFFER) + by.get(Status.REJECTED);
        long rate = submitted == 0 ? 0 : Math.round(100.0 * responded / submitted);
        return new Stats(list.size(), by, rate);
    }

    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public JobApplication create(@Valid @RequestBody AppRequest r, Authentication auth) {
        JobApplication a = new JobApplication();
        a.setOwnerId(uid(auth));
        apply(a, r);
        return repo.save(a);
    }

    @PutMapping("/{id}")
    public JobApplication update(@PathVariable Long id, @Valid @RequestBody AppRequest r, Authentication auth) {
        JobApplication a = owned(id, auth);
        apply(a, r);
        return repo.save(a);
    }

    /** Used by the drag-and-drop board. */
    @PatchMapping("/{id}/status")
    public JobApplication move(@PathVariable Long id, @Valid @RequestBody StatusRequest r, Authentication auth) {
        JobApplication a = owned(id, auth);
        a.setStatus(r.status());
        if (r.status() == Status.APPLIED && a.getAppliedDate() == null) a.setAppliedDate(LocalDate.now());
        return repo.save(a);
    }

    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Authentication auth) { repo.delete(owned(id, auth)); }
}
