package com.jobtracker.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter @Setter
public class JobApplication {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @Column(nullable = false)
    private Long ownerId;

    @Column(nullable = false) private String company;
    @Column(nullable = false) private String jobTitle;
    private String location;
    private String jobUrl;
    private String salary;

    @Enumerated(EnumType.STRING)
    private Status status = Status.WISHLIST;

    private LocalDate appliedDate;
    private LocalDate followUpDate;
    @Column(length = 2000) private String notes;

    @JsonIgnore private boolean reminderSent;
    private LocalDateTime createdAt = LocalDateTime.now();
}
