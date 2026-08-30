package com.massgs.repository;

import com.massgs.entity.CropAlias;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CropAliasRepository extends JpaRepository<CropAlias, Long> {

    List<CropAlias> findByCropId(Long cropId);

    Optional<CropAlias> findByAliasNameIgnoreCase(String aliasName);

    @Query("SELECT ca FROM CropAlias ca WHERE LOWER(ca.aliasName) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<CropAlias> searchByAliasContaining(@Param("query") String query);
}
