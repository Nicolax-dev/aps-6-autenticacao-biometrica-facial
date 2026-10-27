package br.aps6.api.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import br.aps6.api.model.Informacao;

public interface InformacaoRepository extends JpaRepository<Informacao, Integer> {

    List<Informacao> findByNivelAcessoLessThanEqualOrderByNivelAcessoAscIdAsc(Short nivelAcesso);
}