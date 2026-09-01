package com.cuberank.backend.catalog;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

import com.cuberank.backend.catalog.CubeNameGrouper.ParsedName;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class CubeNameGrouperTest {

    @ParameterizedTest(name = "{0}")
    @MethodSource("parseCases")
    void parsesBaseNameAndVersion(String title, String brand, String type, String baseName, String version) {
        ParsedName parsed = CubeNameGrouper.parse(title, brand, type);
        assertEquals(baseName, parsed.baseName());
        assertEquals(version, parsed.versionLabel());
        assertEquals(CubeNameGrouper.groupKey(baseName), parsed.groupKey());
    }

    static Stream<Arguments> parseCases() {
        return Stream.of(
                Arguments.of(
                        "MoYu WeiLong Ferrocore V2 3x3",
                        "MoYu",
                        "3x3",
                        "MoYu WeiLong Ferrocore V2",
                        "Standard"),
                Arguments.of(
                        "MoYu WeiLong Ferrocore V2 3x3 (UV Coated)",
                        "MoYu",
                        "3x3",
                        "MoYu WeiLong Ferrocore V2",
                        "UV Coated"),
                Arguments.of(
                        "The FerYooCore V2 UV 3x3",
                        "MoYu",
                        "3x3",
                        "The FerYooCore V2",
                        "UV"),
                Arguments.of(
                        "The FerYooCore V2 3x3",
                        "MoYu",
                        "3x3",
                        "The FerYooCore V2",
                        "Standard"),
                Arguments.of(
                        "MoYu RS3 M V5 3x3 (Standard)",
                        "MoYu",
                        "3x3",
                        "MoYu RS3 M V5",
                        "Standard"),
                Arguments.of(
                        "MoYu RS3 M V5 3x3 (Spring Tension)",
                        "MoYu",
                        "3x3",
                        "MoYu RS3 M V5",
                        "Spring Tension"),
                Arguments.of(
                        "MoYu RS3 M V5 3x3 (Ball Core UV + Robot Cube Stand)",
                        "MoYu",
                        "3x3",
                        "MoYu RS3 M V5",
                        "Ball Core UV + Robot Cube Stand"),
                Arguments.of(
                        "MoYu RS3 M V5 SE 3x3 (8-Magnet Ball-Core + MagLev + UV)",
                        "MoYu",
                        "3x3",
                        "MoYu RS3 M V5 SE",
                        "8-Magnet Ball-Core + MagLev + UV"),
                Arguments.of(
                        "DaYan GuHong Pro+ 3x3 55mm (MagLev)",
                        "DaYan",
                        "3x3",
                        "DaYan GuHong Pro+ 55mm",
                        "MagLev"),
                Arguments.of(
                        "DaYan GuHong Pro+ 3x3 56mm (MagLev)",
                        "DaYan",
                        "3x3",
                        "DaYan GuHong Pro+ 56mm",
                        "MagLev"),
                Arguments.of(
                        "GAN330 Keychain Cube 3x3",
                        "GAN",
                        "3x3",
                        "GAN330 Keychain Cube",
                        "Standard"),
                Arguments.of(
                        "Practice Special Cube (F2L-3)",
                        "Calvin's Puzzle",
                        "3x3",
                        "Practice Special Cube",
                        "F2L-3"),
                Arguments.of(
                        "GAN17 MagDrive UV 3x3",
                        "GAN",
                        "3x3",
                        "GAN17 MagDrive",
                        "UV"),
                Arguments.of(
                        "GAN V100 MagLev UV 3x3",
                        "GAN",
                        "3x3",
                        "GAN V100",
                        "MagLev + UV"),
                Arguments.of(
                        "GAN15 UV 3x3 (NewBlack)",
                        "GAN",
                        "3x3",
                        "GAN15",
                        "UV + NewBlack"),
                Arguments.of(
                        "DaYan FTO (Magnetic + Ball-Core)",
                        "DaYan",
                        "FTO",
                        "DaYan FTO",
                        "Magnetic + Ball-Core"),
                Arguments.of(
                        "DaYan FTO (Magnetic + Ball-Core, Black Internals SAOCube SE)",
                        "DaYan",
                        "FTO",
                        "DaYan FTO",
                        "Magnetic + Ball-Core, Black Internals SAOCube SE"),
                Arguments.of(
                        "MoYu WeiLong Ferrocore UV 3x3 (Special Edition WRM V10)",
                        "MoYu",
                        "3x3",
                        "MoYu WeiLong Ferrocore",
                        "UV + Special Edition WRM V10"),
                Arguments.of(
                        "PBCube WR 3x3 (20-Magnet Ball-Core + MagLev + UV) [Pre-Order]",
                        "MoYu",
                        "3x3",
                        "PBCube WR",
                        "20-Magnet Ball-Core + MagLev + UV + Pre-Order"),
                Arguments.of(
                        "X-Man Tornado V5 3x3 (Pioneer UV, PiCube SE)",
                        "X-Man Design",
                        "3x3",
                        "X-Man Tornado V5",
                        "Pioneer UV, PiCube SE"),
                Arguments.of(
                        "X-Man Tornado V3 M",
                        "X-Man Design",
                        "3x3",
                        "X-Man Tornado V3",
                        "M"),
                Arguments.of(
                        "X-Man Tornado V3 Premium",
                        "X-Man Design",
                        "3x3",
                        "X-Man Tornado V3",
                        "Premium"),
                Arguments.of(
                        "X-Man Tornado V4 3x3 (10th Anniversary Limited Edition)",
                        "X-Man Design",
                        "3x3",
                        "X-Man Tornado V4",
                        "10th Anniversary Limited Edition"),
                Arguments.of(
                        "X-Man Tornado V4 3x3 (Flagship) - PiCube Special Edition",
                        "X-Man Design",
                        "3x3",
                        "X-Man Tornado V4",
                        "Flagship + PiCube Special Edition"),
                Arguments.of(
                        "X-Man Tornado V4 AI",
                        "X-Man Design",
                        "3x3",
                        "X-Man Tornado V4",
                        "AI"),
                Arguments.of(
                        "X-Man Tornado V4 M",
                        "X-Man Design",
                        "3x3",
                        "X-Man Tornado V4",
                        "M"),
                Arguments.of(
                        "X-Man Tornado V5",
                        "X-Man Design",
                        "3x3",
                        "X-Man Tornado V5",
                        "Standard"),
                Arguments.of(
                        "X-Man Tornado V5 3x3 (Pioneer UV, LE)",
                        "QiYi",
                        "3x3",
                        "X-Man Tornado V5",
                        "Pioneer UV, LE"));
    }

    @Test
    void ferrocoreUvSharesFamilyWithStandard() {
        ParsedName standard = CubeNameGrouper.parse("MoYu WeiLong Ferrocore V2 3x3", "MoYu", "3x3");
        ParsedName uv = CubeNameGrouper.parse("MoYu WeiLong Ferrocore V2 3x3 (UV Coated)", "MoYu", "3x3");
        assertEquals(standard.groupKey(), uv.groupKey());
        assertEquals("Standard", standard.versionLabel());
        assertEquals("UV Coated", uv.versionLabel());
    }

    @Test
    void rs3SeStaysSeparateFromRs3Family() {
        ParsedName standard = CubeNameGrouper.parse("MoYu RS3 M V5 3x3 (Standard)", "MoYu", "3x3");
        ParsedName se = CubeNameGrouper.parse(
                "MoYu RS3 M V5 SE 3x3 (8-Magnet Ball-Core + MagLev + UV)", "MoYu", "3x3");
        assertNotEquals(standard.groupKey(), se.groupKey());
    }

    @Test
    void sizeVariantsStaySeparate() {
        ParsedName fiftyFive = CubeNameGrouper.parse("DaYan GuHong Pro+ 3x3 55mm (MagLev)", "DaYan", "3x3");
        ParsedName fiftySix = CubeNameGrouper.parse("DaYan GuHong Pro+ 3x3 56mm (MagLev)", "DaYan", "3x3");
        assertNotEquals(fiftyFive.groupKey(), fiftySix.groupKey());
    }

    @Test
    void ferrocoreGenerationsStaySeparate() {
        ParsedName v2 = CubeNameGrouper.parse("MoYu WeiLong Ferrocore V2 3x3", "MoYu", "3x3");
        ParsedName v10 = CubeNameGrouper.parse(
                "MoYu WeiLong Ferrocore UV 3x3 (Special Edition WRM V10)", "MoYu", "3x3");
        assertNotEquals(v2.groupKey(), v10.groupKey());
    }

    @Test
    void feryoocoreDoesNotGroupWithWeilong() {
        ParsedName feryoo = CubeNameGrouper.parse("The FerYooCore V2 UV 3x3", "MoYu", "3x3");
        ParsedName ferrocore = CubeNameGrouper.parse("MoYu WeiLong Ferrocore V2 3x3", "MoYu", "3x3");
        assertNotEquals(feryoo.groupKey(), ferrocore.groupKey());
    }

    @Test
    void dayanFtoSpecialEditionGroupsWithBase() {
        ParsedName base = CubeNameGrouper.parse("DaYan FTO (Magnetic + Ball-Core)", "DaYan", "FTO");
        ParsedName se = CubeNameGrouper.parse(
                "DaYan FTO (Magnetic + Ball-Core, Black Internals SAOCube SE)", "DaYan", "FTO");
        assertEquals(base.groupKey(), se.groupKey());
    }

    @Test
    void tornadoGenerationsGroupToThreeFamilies() {
        ParsedName v3m = CubeNameGrouper.parse("X-Man Tornado V3 M", "X-Man Design", "3x3");
        ParsedName v3premium = CubeNameGrouper.parse("X-Man Tornado V3 Premium", "X-Man Design", "3x3");
        ParsedName v4anniversary = CubeNameGrouper.parse(
                "X-Man Tornado V4 3x3 (10th Anniversary Limited Edition)", "X-Man Design", "3x3");
        ParsedName v4picube = CubeNameGrouper.parse(
                "X-Man Tornado V4 3x3 (Flagship) - PiCube Special Edition", "X-Man Design", "3x3");
        ParsedName v4ai = CubeNameGrouper.parse("X-Man Tornado V4 AI", "X-Man Design", "3x3");
        ParsedName v4m = CubeNameGrouper.parse("X-Man Tornado V4 M", "X-Man Design", "3x3");
        ParsedName v5 = CubeNameGrouper.parse("X-Man Tornado V5", "X-Man Design", "3x3");
        ParsedName v5pioneer = CubeNameGrouper.parse(
                "X-Man Tornado V5 3x3 (Pioneer UV, LE)", "QiYi", "3x3");

        assertEquals(v3m.groupKey(), v3premium.groupKey());
        assertEquals(v4anniversary.groupKey(), v4picube.groupKey());
        assertEquals(v4picube.groupKey(), v4ai.groupKey());
        assertEquals(v4ai.groupKey(), v4m.groupKey());
        assertEquals(v5.groupKey(), v5pioneer.groupKey());
        assertNotEquals(v3m.groupKey(), v4m.groupKey());
        assertNotEquals(v4m.groupKey(), v5.groupKey());
        assertNotEquals(v3m.groupKey(), v5.groupKey());
    }

    @Test
    void sameBaseNameSharesFamilyAcrossVendors() {
        ParsedName xman = CubeNameGrouper.parse("X-Man Tornado V5", "X-Man Design", "3x3");
        ParsedName qiyi = CubeNameGrouper.parse("X-Man Tornado V5 3x3 (Pioneer UV, LE)", "QiYi", "3x3");
        assertEquals(xman.groupKey(), qiyi.groupKey());
    }

    @Test
    void brandPrefixedTitlesStaySeparateFamilies() {
        ParsedName gan = CubeNameGrouper.parse("GAN RS3 M V5 3x3 (Standard)", "GAN", "3x3");
        ParsedName moyu = CubeNameGrouper.parse("MoYu RS3 M V5 3x3 (Standard)", "MoYu", "3x3");
        assertNotEquals(gan.groupKey(), moyu.groupKey());
    }

    @Test
    void magDriveStaysInBaseName() {
        ParsedName parsed = CubeNameGrouper.parse("GAN17 MagDrive UV 3x3", "GAN", "3x3");
        assertEquals("GAN17 MagDrive", parsed.baseName());
        assertEquals("UV", parsed.versionLabel());
    }
}
