package br.aps6.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.aps6.api.model.LogAcesso;

public interface LogAcessoRepository extends JpaRepository<LogAcesso, Integer> {
}