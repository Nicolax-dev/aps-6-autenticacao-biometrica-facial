package br.aps6.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.aps6.api.model.Cargo;

public interface CargoRepository extends JpaRepository<Cargo, Integer> {
}