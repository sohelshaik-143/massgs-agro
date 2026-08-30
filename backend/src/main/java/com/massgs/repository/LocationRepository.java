package com.massgs.repository;

import com.massgs.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {

    List<Location> findByStateOrderByDistrictAsc(String state);

    List<Location> findByDistrictOrderByMandalAsc(String district);

    List<Location> findByMandalOrderByVillageAsc(String mandal);

    @Query("SELECT l FROM Location l WHERE " +
           "LOWER(l.village) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(l.mandal) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(l.district) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(l.state) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Location> searchLocations(@Param("query") String query);

    @Query("SELECT DISTINCT l.district FROM Location l WHERE LOWER(l.state) = LOWER(:state) ORDER BY l.district ASC")
    List<String> findDistinctDistrictsByState(@Param("state") String state);

    @Query("SELECT DISTINCT l.mandal FROM Location l WHERE LOWER(l.district) = LOWER(:district) ORDER BY l.mandal ASC")
    List<String> findDistinctMandalsByDistrict(@Param("district") String district);

    @Query("SELECT DISTINCT l.village FROM Location l WHERE LOWER(l.mandal) = LOWER(:mandal) ORDER BY l.village ASC")
    List<String> findDistinctVillagesByMandal(@Param("mandal") String mandal);
}
