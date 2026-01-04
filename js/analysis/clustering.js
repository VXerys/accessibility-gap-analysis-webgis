Object.assign(AnalysisUtils, {
  async performClustering() {
    this.clearAnalysisLayers();
    UIUtils.showLoading();

    setTimeout(() => {
      try {
        const facilities = this.state.allFacilities;
        if (!facilities || facilities.length === 0)
          throw new Error("Data fasilitas belum dimuat.");

        const categories = {
          SD: {
            data: [],
            color: "#0066cc",
            label: "Sekolah Dasar",
            alias: "Cluster SD",
          },
          SMP: {
            data: [],
            color: "#28a745",
            label: "SMP/Sederajat",
            alias: "Cluster SMP",
          },
          SMA: {
            data: [],
            color: "#dc3545",
            label: "SMA/SMK",
            alias: "Cluster SMA",
          },
          Universitas: {
            data: [],
            color: "#6f42c1",
            label: "Perguruan Tinggi",
            alias: "Kawasan Kampus",
          },
          Kesehatan: {
            data: [],
            color: "#17a2b8",
            label: "Fasilitas Kesehatan",
            alias: "Zona Kesehatan",
          },
          Lainnya: {
            data: [],
            color: "#6c757d",
            label: "Fasilitas Umum",
            alias: "Area Fasum",
          },
        };

        facilities.forEach((f) => {
          const props = f.properties;
          const name = this.getRealFacilityName(props).toLowerCase();
          const pt = turf.point(f.geometry.coordinates, f.properties);

          if (
            name.includes("sd ") ||
            name.includes("mib") ||
            name.includes("sdn")
          )
            categories.SD.data.push(pt);
          else if (name.includes("smp") || name.includes("mts"))
            categories.SMP.data.push(pt);
          else if (
            name.includes("sma") ||
            name.includes("smk") ||
            name.includes("man")
          )
            categories.SMA.data.push(pt);
          else if (
            name.includes("universitas") ||
            name.includes("stikes") ||
            name.includes("akade")
          )
            categories.Universitas.data.push(pt);
          else if (
            name.includes("rs ") ||
            name.includes("sakit") ||
            name.includes("puskesmas") ||
            name.includes("klinik") ||
            name.includes("posyandu")
          )
            categories.Kesehatan.data.push(pt);
          else categories.Lainnya.data.push(pt);
        });

        let resultHTML = "";
        let totalClusters = 0;

        Object.keys(categories).forEach((key) => {
          const cat = categories[key];
          if (cat.data.length === 0) return;

          let k = Math.min(5, Math.ceil(cat.data.length / 3));
          if (cat.data.length < 3) k = 1;

          const collection = turf.featureCollection(cat.data);
          const clustered = turf.clustersKmeans(collection, {
            numberOfClusters: k,
          });
          const groupCoords = {};

          clustered.features.forEach((feature) => {
            const clusterId = feature.properties.cluster;
            L.circleMarker(
              [
                feature.geometry.coordinates[1],
                feature.geometry.coordinates[0],
              ],
              {
                radius: 5,
                fillColor: cat.color,
                color: "#fff",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8,
              }
            )
              .bindPopup(
                `<b>${this.getRealFacilityName(feature.properties)}</b><br>${
                  cat.alias
                } #${clusterId + 1}`
              )
              .addTo(this.state.analysisLayer);
            if (!groupCoords[clusterId]) groupCoords[clusterId] = [];
            groupCoords[clusterId].push(feature.geometry.coordinates);
          });

          Object.keys(groupCoords).forEach((cId) => {
            totalClusters++;
            const coords = groupCoords[cId];
            if (coords.length >= 3) {
              const pts = turf.featureCollection(
                coords.map((c) => turf.point(c))
              );
              const hull = turf.convex(pts);
              if (hull) {
                L.geoJSON(hull, {
                  style: {
                    color: cat.color,
                    weight: 2,
                    dashArray: "5, 5",
                    fillOpacity: 0.1,
                    fillColor: cat.color,
                  },
                })
                  .bindTooltip(`${cat.alias} ${parseInt(cId) + 1}`, {
                    permanent: true,
                    direction: "center",
                    className: "cluster-label",
                  })
                  .addTo(this.state.analysisLayer);
              }
            }
          });

          resultHTML += `<div style="margin-bottom:8px; display:flex; align-items:center; justify-content:space-between; font-size:0.9em; border-bottom:1px solid #eee; padding-bottom:5px;"><div style="display:flex; align-items:center; gap:8px;"><span style="display:inline-block; width:10px; height:10px; background:${cat.color}; border-radius:50%;"></span><span style="color:#555;">${cat.label}</span></div><span style="font-weight:bold; color:#333;">${k} Cluster</span></div>`;
        });

        this.showResults(`
                  <div class="result-item" style="border:none; box-shadow:none;">
                       <div style="margin-bottom:15px; text-align:center;">
                          <div style="font-size:32px;">🧩</div>
                          <h4 style="margin:5px 0 0 0; color:#2c3e50;">Category Clustering</h4>
                          <span style="font-size:0.8em; color:#888;">Spatial Grouping by Type</span>
                      </div>
                      <div style="background:#f8f9fa; padding:12px; border-radius:8px; margin-bottom:15px; font-size:0.9em; color:#444; line-height:1.5;">Algoritma telah mendeteksi <strong>${totalClusters} zona fasilitas</strong> berdasarkan kategori pendidikan dan kesehatan.</div>
                      <div style="margin-bottom:15px; background:#fff; border:1px solid #eee; padding:10px; border-radius:8px;">${resultHTML}</div>
                      <div style="font-size:0.85em; color:#666; border-top:1px solid #eee; padding-top:10px;">
                          <strong>🎯 Manfaat Analisis Ini:</strong><br>
                          <ul style="padding-left:15px; margin:5px 0 0 0; line-height:1.4;">
                              <li><strong>Identifikasi Pusat Layanan:</strong> Area dengan cluster padat menandakan kawasan pusat kegiatan.</li>
                              <li><strong>Deteksi Ketimpangan:</strong> Jika fasilitas menumpuk, mungkin ada wilayah lain yang tidak terlayani (Blind Spot).</li>
                              <li><strong>Perencanaan Transportasi:</strong> Cluster fasilitas umum membutuhkan rute angkutan umum.</li>
                          </ul>
                      </div>
                  </div>
              `);
      } catch (e) {
        console.error("Clustering error:", e);
        this.showResults("Gagal melakukan clustering.", "error");
      } finally {
        UIUtils.hideLoading();
      }
    }, 500);
  },
});
